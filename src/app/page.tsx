"use client";

import Image from "next/image";
import styles from "./page.module.css";

import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function Home() {
	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState("N/A");

	useEffect(() => {
		if (socket.connected) {
			onConnect();
		}

		function onConnect() {
			setIsConnected(true);
			setTransport(socket.io.engine.transport.name);

			socket.io.engine.on("upgrade", (transport: any) => {
				setTransport(transport.name);
			});
		}

		function onDisconnect() {
			setIsConnected(false);
			setTransport("N/A");
		}

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
		};
	}, []);

	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<div>
					<p>Status: {isConnected ? "connected" : "disconnected"}</p>
					<p>Transport: {transport}</p>
				</div>
			</main>
			<footer className={styles.footer}></footer>
		</div>
	);
}
