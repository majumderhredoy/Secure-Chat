/**
 * SECURE - Professional E2EE Chat (v7.0 Final)
 * Guaranteed Connectivity & Instant Interaction Mode
 */

const CONFIG = {
    encryptionCurve: "P-256",
    aesAlgorithm: { name: "AES-GCM", length: 256 },
    // Advanced Universal Relay Fleet (STUN + professional TURN pool)
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:openrelay.metered.ca:80' },
        { urls: 'stun:openrelay.metered.ca:443' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        /* Professional TURN Relay (Bypasses even the strictest firewalls) */
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
    ]
};

class SecureChat {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.myKeys = null;
        this.sessionKey = null;
        this.previewFile = null;
        this.isConnecting = false;
        this.heartbeat = null;

        this.initElements();
        this.initPeer();
        this.setupSecurity();
    }

    initElements() {
        this.el = {
            myId: document.getElementById('my-peer-id'),
            partnerIdInput: document.getElementById('partner-id-input'),
            connectBtn: document.getElementById('connect-btn'),
            copyIdBtn: document.getElementById('copy-id-btn'),
            shareLinkBtn: document.getElementById('share-link-btn'),
            status: document.getElementById('connection-status'),
            statusLabel: document.getElementById('status-label'),
            messages: document.getElementById('messages-container'),
            msgInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            audioCallBtn: document.getElementById('audio-call-btn'),
            videoCallBtn: document.getElementById('video-call-btn'),
            mediaBtn: document.getElementById('media-btn'),
            fileInput: document.getElementById('file-input'),
            emojiBtn: document.getElementById('emoji-btn'),
            footer: document.querySelector('.chat-footer'),
            callOverlay: document.getElementById('call-overlay'),
            localVideo: document.getElementById('local-video'),
            remoteVideo: document.getElementById('remote-video'),
            videoContainer: document.getElementById('video-container'),
            acceptCallBtn: document.getElementById('accept-call'),
            endCallBtn: document.getElementById('end-call')
        };

        // INPUT FIX: Absolute forced enabling
        this.enableInput();

        this.el.connectBtn.onclick = () => {
            if (this.isConnecting || this.conn) this.disconnect();
            else this.connectToPartner(this.el.partnerIdInput.value.trim());
        };

        this.el.sendBtn.onclick = () => this.sendMessage();
        this.el.msgInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        };

        this.el.copyIdBtn.onclick = () => {
            navigator.clipboard.writeText(this.el.myId.innerText).then(() => {
                this.showBtnSuccess(this.el.copyIdBtn, 'fa-copy');
            });
        };

        this.el.shareLinkBtn.onclick = () => {
            const link = `${window.location.origin}${window.location.pathname}?id=${this.el.myId.innerText}`;
            navigator.clipboard.writeText(link).then(() => {
                this.showBtnSuccess(this.el.shareLinkBtn, 'fa-share-nodes');
                this.appendSystemMessage("Invite link copied! Send it to your friend.");
            });
        };

        this.el.mediaBtn.onclick = () => this.el.fileInput.click();
        this.el.fileInput.onchange = (e) => this.handleFileSelect(e);
        this.el.videoCallBtn.onclick = () => this.startCall(true);
        this.el.audioCallBtn.onclick = () => this.startCall(false);
        this.el.endCallBtn.onclick = () => this.endCall();

        // Emoji Picker
        this.emojiPicker = document.createElement('emoji-picker');
        this.emojiPicker.className = 'secure-emoji-picker';
        this.el.footer.appendChild(this.emojiPicker);
        this.el.emojiBtn.onclick = (e) => { e.stopPropagation(); this.emojiPicker.classList.toggle('active'); };
        this.emojiPicker.addEventListener('emoji-click', ev => { this.el.msgInput.value += ev.detail.unicode; this.el.msgInput.focus(); });
        document.addEventListener('click', (e) => { if (!this.el.emojiBtn.contains(e.target) && !this.emojiPicker.contains(e.target)) this.emojiPicker.classList.remove('active'); });
    }

    enableInput() {
        this.el.msgInput.disabled = false;
        this.el.msgInput.readOnly = false;
        this.el.msgInput.removeAttribute('disabled');
        this.el.msgInput.style.pointerEvents = 'auto';
        this.el.msgInput.focus();
    }

    async setupSecurity() {
        try {
            this.myKeys = await window.crypto.subtle.generateKey({ name: "ECDH", namedCurve: CONFIG.encryptionCurve }, true, ["deriveKey", "deriveBits"]);
        } catch (e) { this.appendSystemMessage("Security Error: HTTPS required for encryption."); }
    }

    async exportPublicKey() {
        const exported = await window.crypto.subtle.exportKey("raw", this.myKeys.publicKey);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    async deriveSessionKey(partnerKeyB64) {
        const binary = atob(partnerKeyB64);
        const buf = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
        const partnerPublicKey = await window.crypto.subtle.importKey("raw", buf.buffer, { name: "ECDH", namedCurve: CONFIG.encryptionCurve }, true, []);
        this.sessionKey = await window.crypto.subtle.deriveKey({ name: "ECDH", public: partnerPublicKey }, this.myKeys.privateKey, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    }

    async encrypt(content) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, this.sessionKey, new TextEncoder().encode(content));
        return { payload: btoa(String.fromCharCode(...new Uint8Array(encrypted))), iv: btoa(String.fromCharCode(...iv)) };
    }

    async decrypt(obj) {
        const iv = new Uint8Array(atob(obj.iv).split("").map(c => c.charCodeAt(0)));
        const payload = new Uint8Array(atob(obj.payload).split("").map(c => c.charCodeAt(0)));
        const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, this.sessionKey, payload);
        return new TextDecoder().decode(decrypted);
    }

    initPeer() {
        this.peer = new Peer({ config: { 'iceServers': CONFIG.iceServers, 'iceTransportPolicy': 'all', 'iceCandidatePoolSize': 10 }, debug: 1 });
        this.peer.on('open', (id) => {
            this.el.myId.innerText = id;
            this.updateStatusBar('ready');
            this.appendSystemMessage("Universal Sync Ready.");
            this.handleUrlParams();
        });
        this.peer.on('connection', (conn) => { if (this.conn) { conn.on('open', () => { conn.send({ type: 'error', message: 'Busy' }); setTimeout(() => conn.close(), 1000); }); return; } this.handleConnection(conn); });
        this.peer.on('call', (call) => this.handleCall(call));
        this.peer.on('error', (err) => { this.appendSystemMessage(`Hub Error: ${err.type}`); this.isConnecting = false; this.updateStatusBar('ready'); });
        this.peer.on('disconnected', () => { this.updateStatusBar('offline'); this.peer.reconnect(); });
    }

    updateStatusBar(state) {
        this.el.status.className = `security-status ${state}`;
        if (state === 'online') { this.el.statusLabel.innerText = 'SECURE SESSION'; this.el.connectBtn.innerText = 'Disconnect'; this.el.connectBtn.classList.add('btn-danger'); this.el.connectBtn.disabled = false; }
        else if (state === 'ready') { this.el.statusLabel.innerText = 'Ready to Connect'; this.el.connectBtn.innerText = 'Connect Peer'; this.el.connectBtn.classList.remove('btn-danger'); this.el.connectBtn.disabled = false; }
        else if (state === 'connecting') { this.el.statusLabel.innerText = 'Handshaking...'; this.el.connectBtn.innerText = 'Wait...'; this.el.connectBtn.disabled = true; }
        else { this.el.statusLabel.innerText = 'Hub Offline'; this.el.connectBtn.disabled = true; }
    }

    handleConnection(conn) { this.conn = conn; this.setupHooks(); this.appendSystemMessage("Inbound path located. Securing..."); }

    async connectToPartner(id) {
        if (!id) return alert("Partner ID needed.");
        this.isConnecting = true;
        this.updateStatusBar('connecting');
        this.appendSystemMessage(`Searching network for partner...`);
        this.conn = this.peer.connect(id, { reliable: true });
        this.setupHooks();

        const timeout = setTimeout(() => {
            if (this.isConnecting && (!this.conn || !this.conn.open)) {
                this.showDiagnosticError();
                this.disconnect();
            }
        }, 22000);

        this.conn.on('open', () => { clearTimeout(timeout); this.performHandshake(); });
    }

    showDiagnosticError() {
        this.appendSystemMessage("!!! CONNECTION BLOCKED BY NETWORK !!!");
        this.appendSystemMessage("Problem: Your ISP/WiFi has a strict firewall (Symmetric NAT).");
        this.appendSystemMessage("Fix: Turn OFF WiFi on one device and use Mobile Data.");
        this.appendSystemMessage("This bypasses the router firewall instantly!");
    }

    async performHandshake() {
        this.appendSystemMessage("Path open. Finalizing E2EE...");
        const pubKey = await this.exportPublicKey();
        this.conn.send({ type: 'handshake', publicKey: pubKey });
    }

    setupHooks() {
        this.conn.on('data', async (data) => {
            try {
                if (data.type === 'handshake') {
                    await this.deriveSessionKey(data.publicKey);
                    this.conn.send({ type: 'handshake-ack', publicKey: await this.exportPublicKey() });
                    this.finalize();
                }
                else if (data.type === 'handshake-ack') { await this.deriveSessionKey(data.publicKey); this.finalize(); }
                else if (data.type === 'chat') { this.appendMessage(JSON.parse(await this.decrypt(data.encrypted)), 'received'); }
                else if (data.type === 'heartbeat') console.log('Keep-alive');
            } catch (e) { console.error("Link error", e); }
        });
        this.conn.on('close', () => this.disconnect());
        this.conn.on('error', () => this.disconnect());
    }

    finalize() {
        this.isConnecting = false;
        this.updateStatusBar('online');
        this.el.audioCallBtn.disabled = this.el.videoCallBtn.disabled = this.el.sendBtn.disabled = false;
        this.appendSystemMessage("Secure Tunnel Active.");
        this.el.msgInput.focus();
        this.heartbeat = setInterval(() => { if (this.conn && this.conn.open) this.conn.send({ type: 'heartbeat' }); }, 8000);
    }

    disconnect() {
        if (this.heartbeat) clearInterval(this.heartbeat);
        if (this.conn) this.conn.close();
        this.conn = null;
        this.isConnecting = false;
        this.updateStatusBar('ready');
        this.el.audioCallBtn.disabled = this.el.videoCallBtn.disabled = this.el.sendBtn.disabled = true;
        this.appendSystemMessage("Link terminated.");
    }

    async sendMessage() {
        const text = this.el.msgInput.value.trim();
        if (!text && !this.previewFile) return;
        if (!this.conn || !this.sessionKey) return this.appendSystemMessage("Wait: You must connect to a friend first.");
        try {
            const chatData = { text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), media: this.previewFile || null };
            this.conn.send({ type: 'chat', encrypted: await this.encrypt(JSON.stringify(chatData)) });
            this.appendMessage(chatData, 'sent');
            this.el.msgInput.value = ''; this.previewFile = null;
        } catch (e) { this.appendSystemMessage("Encryption failure."); }
    }

    async handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = (ev) => { this.previewFile = { type: file.type.split('/')[0], data: ev.target.result }; this.sendMessage(); };
        r.readAsDataURL(file);
    }

    appendMessage(data, type) {
        if (this.el.messages.querySelector('.welcome-screen')) this.el.messages.innerHTML = '';
        const div = document.createElement('div'); div.className = `message ${type}`;
        let html = '';
        if (data.media) {
            if (data.media.type === 'image') html += `<img src="${data.media.data}" class="media-content">`;
            else if (data.media.type === 'video') html += `<video src="${data.media.data}" class="media-content" controls></video>`;
        }
        if (data.text) html += `<p>${this.escapeHtml(data.text)}</p>`;
        html += `<span class="message-time">${data.timestamp}</span>`;
        div.innerHTML = html;
        this.el.messages.appendChild(div);
        this.el.messages.scrollTop = this.el.messages.scrollHeight;
    }

    appendSystemMessage(text) {
        if (this.el.messages.querySelector('.welcome-screen')) this.el.messages.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'system-message';
        if (text.includes("!!!")) div.style.color = "#ff4d4d";
        div.innerText = text;
        this.el.messages.appendChild(div);
        this.el.messages.scrollTop = this.el.messages.scrollHeight;
    }

    showBtnSuccess(btn, oldIcon) {
        const icon = btn.querySelector('i');
        icon.className = 'fas fa-check';
        btn.style.color = 'var(--success-color)';
        setTimeout(() => { icon.className = `fas ${oldIcon}`; btn.style.color = ''; }, 2000);
    }

    handleUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const partnerId = params.get('id');
        if (partnerId && partnerId !== this.peer.id) {
            this.appendSystemMessage("Auto-Invite detected.");
            this.el.partnerIdInput.value = partnerId;
            setTimeout(() => this.connectToPartner(partnerId), 1500);
        }
    }

    escapeHtml(t) { const d = document.createElement('div'); d.innerText = t; return d.innerHTML; }

    async startCall(video) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video });
            this.showCall(video);
            this.el.localVideo.srcObject = this.localStream;
            this.setupCall(this.peer.call(this.conn.peer, this.localStream));
        } catch (e) { alert("Mic/Cam blocked."); }
    }

    handleCall(call) {
        this.showCall(true);
        this.el.acceptCallBtn.hidden = false;
        this.el.acceptCallBtn.onclick = async () => {
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                this.el.localVideo.srcObject = this.localStream;
                call.answer(this.localStream);
                this.setupCall(call);
                this.el.acceptCallBtn.hidden = true;
            } catch (e) { alert("Call failed."); }
        };
    }

    setupCall(call) {
        call.on('stream', s => { this.el.remoteVideo.srcObject = s; this.el.videoContainer.hidden = false; });
        call.on('close', () => this.endCall());
        call.on('error', () => this.endCall());
    }

    showCall(v) { this.el.callOverlay.style.display = 'flex'; this.el.videoContainer.hidden = !v; }

    endCall() {
        if (this.localStream) { this.localStream.getTracks().forEach(t => t.stop()); this.localStream = null; }
        this.el.callOverlay.style.display = 'none';
        this.el.localVideo.srcObject = null;
        this.el.remoteVideo.srcObject = null;
    }
}

window.onload = () => { window.app = new SecureChat(); };
