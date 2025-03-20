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
    console.log("Users online: "+ (clients.size+1))

    ws.onmessage = (message) => {
        const currentTime = new Date();
        const [hours, minutes, seconds] = [currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds()];
        try {
            const data = JSON.parse(message.data + "");

            if (data.type === 'register') {
                const availableLogin = ![...clients.values()].includes(data.name);
                clients.set(ws, availableLogin ? data.name : '');
                if (!availableLogin) {
                    ws.send(JSON.stringify({
                        type: "error",
                        name: data.name,
                        message: "The name is already taken"
                    }));
                    return;
                }
                ws.send(JSON.stringify({ type: "registered", name: data.name }));
                onlineCountSend();
            } else if (!clients.get(ws)) {
                ws.send(JSON.stringify({ type: "error", message: "You are not registered in chat" }));
            } else if (data.type === 'message') {
                clients.forEach((name, client) => {
                    if (client.readyState === WebSocket.OPEN && name != '') {
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
        console.log("Users online: "+ (clients.size))
    };
});
console.log('WebSocket server running on ws://localhost:8080');
