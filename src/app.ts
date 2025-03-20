import WebSocket, { WebSocketServer } from 'ws';

const webSocketServer = new WebSocketServer({ port: 8080 });
const clients = new Map<WebSocket, string>();

const onlineCountSend = () => {
    const onlineCount = clients.size;
    webSocketServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'online', count: onlineCount }));
        }
    });
};

webSocketServer.on('connection', (ws: WebSocket) => {
    onlineCountSend();

    ws.onmessage = (message) => {
        const currentTime = new Date();
        const [hours, minutes, seconds] = [currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds()];
        try {
            const data = JSON.parse(message.data + "");

            if (data.type === 'register') {
                const checkLogin = [...clients.values()].includes(data.name);
                if (checkLogin) {
                    ws.send(JSON.stringify({
                        type: "error",
                        name: data.name,
                        message: "The name is already taken"
                    }));
                    return;
                }

                clients.set(ws, data.name);
                ws.send(JSON.stringify({ type: "registered", name: data.name }));
                onlineCountSend();
            } else if (!clients.get(ws)) {
                ws.send(JSON.stringify({ type: "error", message: "You are not registered in chat" }));
            } else if (data.type === 'message') {
                webSocketServer.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            message: data.message,
                            name: clients.get(ws),
                            time: `${hours}:${minutes}:${seconds}`
                        }));
                    }
                });
            }
        } catch (e) {
            console.log(e);
        }
    };

    ws.onclose = () => {
        clients.delete(ws);
        onlineCountSend();
    };
});

console.log('WebSocket server running on ws://localhost:8080');
