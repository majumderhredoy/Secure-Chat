# 🔐 Secure Chat

A privacy-focused real-time communication application that allows two users to connect securely using a dynamically generated hash key. Designed with simplicity and security in mind, Secure Chat ensures that conversations remain private and leave no trace after the session ends.

---

## 🚀 Features

- 🔑 **Dynamic Hash-Based Pairing**
  - Each session uses a newly generated unique hash key
  - Only users with the same key can connect

- 👥 **Two-User Exclusive Connection**
  - Strict one-to-one communication
  - No group chats or third-party access

- 💬 **Real-Time Messaging**
  - Instant text communication between connected users

- 🎥 **Audio & Video Calling**
  - Seamless peer-to-peer audio and video calls

- 🗑️ **Auto Data Deletion**
  - All chat history and session data are permanently deleted once the connection ends

- 🔒 **Privacy First**
  - No stored messages
  - No persistent user tracking

---

## 🛠️ Tech Stack

- **Frontend:**
  - HTML
  - CSS
  - JavaScript

- **Core Technologies:**
  - WebRTC (for real-time audio/video communication)
  - WebSockets / Peer-to-Peer Communication (depending on implementation)

---

## 📂 Project Structure

```
secure-chat/
│── index.html
│── style.css
│── app.js
│── assets/
│── README.md
```

---

## ⚙️ How It Works

1. A user generates a **unique hash key**
2. The key is shared with another user
3. Both users enter the same key to establish a connection
4. A secure session is created:
   - Messaging
   - Audio/video communication
5. Once any user disconnects:
   - The session ends
   - All data is **automatically deleted**

---

## 🧪 Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/secure-chat.git
```

2. Navigate to the project folder:
```bash
cd secure-chat
```

3. Open `index.html` in your browser

---

## 📸 Screenshots

_Add screenshots of your UI here (optional)_

---

## 🔐 Security Highlights

- Temporary session-based communication
- No database storage of messages
- Unique key per session prevents unauthorized access
- Automatic cleanup after disconnect

---

## 📌 Future Improvements

- End-to-End Encryption (E2EE)
- File sharing support
- Mobile responsiveness
- User authentication (optional)
- Better UI/UX enhancements

---

## 🤝 Contribution

Contributions are welcome!

1. Fork the repository  
2. Create a new branch (`feature-new`)  
3. Commit your changes  
4. Push to the branch  
5. Open a Pull Request  

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Hredoy Majumder**  
Junior Software Engineer (AI)  
Skills: Web Development | AI | Machine Learning | RAG Systems  

---

## ⭐ Support

If you like this project, please give it a ⭐ on GitHub!
