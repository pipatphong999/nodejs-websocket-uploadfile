const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.static("public"));

wss.on("connection", (ws) => {
  let fileInfo = null;
  let data = null;
  let filePath = null;
  let stream = null;
  ws.on("message", (message) => {
    try {
      data = message;
      if (Buffer.isBuffer(message)) {
        stream.write(message, () => {
          const percent = (
            (stream.bytesWritten / fileInfo.fileSize) *
            100
          ).toFixed(2);
          ws.send(JSON.stringify({ type: "progress", percent }));
        });
      } else {
        data = JSON.parse(data);
        if (data.type === "start") {
          fileInfo = data;
          filePath = path.join(uploadsDir, fileInfo.fileName);
          stream = fs.createWriteStream(filePath);
          ws.send(JSON.stringify({ type: "start", percent: 0 }));
        }
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  });

  ws.on("close", () => {
    stream.end();
    console.log("File upload complete:", fileInfo.fileName);
  });
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
