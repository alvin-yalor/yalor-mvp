// A quick script to simulate a user messaging the dummy chatbot,
// which in turn hits the ACE MCP webhook.
async function runTestFlow() {
    console.log('--- Starting ACE End-to-End Test Flow ---');

    const sessionId = 'test-session-auth-123';

    // 1. Simulate the User sending a message to the AI Chatbot
    // The Chatbot will forward this to the ACE MCP.
    console.log('\n💬 [User]: "I need to buy some steaks for a BBQ tonight."');

    try {
        const startTime = Date.now();
        const response = await fetch('http://localhost:3000/api/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                message: 'I need to buy some steaks for a BBQ tonight.'
            })
        });

        const data = await response.json();
        const endTime = Date.now();

        console.log(`\n⏳ [ACE-MCP] Finished in ${endTime - startTime}ms`);

        if (data.status === 'success') {
            console.log('\n✅ [ACE-MCP] Returned Payload to Client UI:\n');
            console.dir(data.payload, { depth: null, colors: true });
        } else {
            console.log('\n❌ [ACE-MCP] No opportunity or auction failed:', data);
        }

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

runTestFlow();
