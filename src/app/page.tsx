"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

// Define types locally (we'll import the socket only on the client side)
interface User {
	id: string;
	name: string;
}

interface Message {
	from: string;
	to?: string;
	message: string;
}

export default function Home() {
	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState("N/A");
	const [socketId, setSocketId] = useState<string | null>(null);
	const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [message, setMessage] = useState("");
	const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
	const [socket, setSocket] = useState<any>(null);

	console.log(`%c === `,`color:red`,` receivedMessages`, receivedMessages);

	// Only initialize socket on the client side
	useEffect(() => {
		// Import socket dynamically to avoid SSR issues
		const initSocket = async () => {
			const { socket, sendMessage } = await import("../socket");
			setSocket(socket);

			if (socket.connected) {
				onConnect();
			}

			function onConnect() {
				setIsConnected(true);
				setSocketId(socket.id);
				setTransport(socket.io.engine.transport.name);

				socket.io.engine.on("upgrade", (transport: any) => {
					setTransport(transport.name);
				});
			}

			function onDisconnect() {
				setIsConnected(false);
				setTransport("N/A");
			}

			function onUsersUpdated(users: User[]) {
				const filteredUsers = users.filter((user) => user.id !== socket.id);
				setConnectedUsers(filteredUsers);
			}

			function onPrivateMessage(data: { from: string; message: string }) {
				setReceivedMessages((prev) => [...prev, data]);
			}

			function onWebhookEvent(data: any) {
				console.log("Received webhook event:", data);

				// Handle different event types
				if (data.eventType === "new_message") {
					setReceivedMessages((prev) => [
						...prev,
						{
							from: data.payload.sender || "System",
							message: data.payload.content,
						},
					]);
				} else if (data.eventType === "notification") {
					// You could show a notification or update some UI element
					console.log("Notification received:", data.payload);
				}
			}

			socket.on("connect", onConnect);
			socket.on("disconnect", onDisconnect);
			socket.on("users-updated", onUsersUpdated);
			socket.on("private-message", onPrivateMessage);
			socket.on('webhook-event', onWebhookEvent);

			return () => {
				socket.off("connect", onConnect);
				socket.off("disconnect", onDisconnect);
				socket.off("users-updated", onUsersUpdated);
				socket.off("private-message", onPrivateMessage);
			};
		};

		initSocket();
	}, []);

	const handleSendMessage = async () => {
		if (!selectedUser || !message.trim() || !socket) return;

		const { sendMessage } = await import("../socket");
		sendMessage(selectedUser.id, message);

		setReceivedMessages((prev) => [
			...prev,
			{
				from: "You",
				to: selectedUser.id,
				message,
			},
		]);
		setMessage("");
	};

	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<div>
					<h2>Connection Status</h2>
					<p>Status: {isConnected ? "connected" : "disconnected"}</p>
					<p>Transport: {transport}</p>
					<p>Your ID: {socketId || "Not connected"}</p>
				</div>

				<div style={{ marginTop: 30 }}>
					<h2>Connected Users ({connectedUsers.length})</h2>
					{connectedUsers.length === 0 ? (
						<p>No other users connected</p>
					) : (
						<ul>
							{connectedUsers.map((user) => (
								<li
									key={user.id}
									style={{
										cursor: "pointer",
										fontWeight: selectedUser?.id === user.id ? "bold" : "normal",
										background: selectedUser?.id === user.id ? "#f0f0f0" : "transparent",
										padding: "5px",
									}}
									onClick={() => setSelectedUser(user)}
								>
									{user.name} ({user.id})
								</li>
							))}
						</ul>
					)}
				</div>

				{selectedUser && (
					<div style={{ marginTop: 30 }}>
						<h2>Chat with {selectedUser.name}</h2>
						<div
							style={{
								border: "1px solid #ccc",
								height: "200px",
								overflowY: "auto",
								padding: "10px",
								marginBottom: "10px",
							}}
						>
							{receivedMessages
								.filter((msg) => msg.from === selectedUser.id || msg.to === selectedUser.id)
								.map((msg, idx) => (
									<div key={idx} style={{ marginBottom: "5px" }}>
										<strong>{msg.from === "You" ? "You" : selectedUser.name}:</strong> {msg.message}
									</div>
								))}
						</div>
						<div style={{ display: "flex" }}>
							<input
								type="text"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								style={{ flexGrow: 1, marginRight: "10px", padding: "5px" }}
								placeholder="Type a message..."
								onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
							/>
							<button onClick={handleSendMessage}>Send</button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
