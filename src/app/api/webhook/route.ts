import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body from the webhook
    const body = await req.json();
    const { userId, eventType, payload } = body;
    
    // Access the global io instance
    const io = (global as any).io;
    const connectedUsers = (global as any).connectedUsers;
    
    if (!io) {
      return NextResponse.json(
        { error: 'Socket server not initialized' },
        { status: 500 }
      );
    }
    
    console.log(`Webhook received for user ${userId}, event: ${eventType}`);
    
    // Option 1: Emit to specific user by finding their socket.id
    // Find all socket IDs that match this userId
    const userSocketIds = [];
    
    // Convert Map to array for easier iteration
    for (const [socketId, userData] of connectedUsers.entries()) {
      if (userData.userId === userId) {
        userSocketIds.push(socketId);
      }
    }
    
    if (userSocketIds.length > 0) {
      // Emit to each socket ID for this user
      userSocketIds.forEach(socketId => {
        io.to(socketId).emit('webhook-event', {
          eventType,
          payload
        });
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `Event emitted to ${userSocketIds.length} sockets for user ${userId}` 
      });
    } 
    
    // Option 2: If no matching sockets, broadcast to everyone
    // (you might want to change this based on your requirements)
    io.emit('webhook-event', {
      userId,
      eventType,
      payload
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Event broadcasted to all users` 
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}