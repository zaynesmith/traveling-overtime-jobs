// index.js
// Script demonstrating how to connect to Supabase via the MCP Client SDK.

// Import the MCP Client package provided by the Model Context Protocol SDK.
const { McpClient } = require('@modelcontextprotocol/sdk/client');
// Import the official Supabase client library for executing queries against the database.
const { createClient } = require('@supabase/supabase-js');

// Define the Supabase connection parameters required to authenticate with the REST API.
const SUPABASE_URL = 'https://kaxlvohgqukmfsylscxp.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheGx2b2hncXVrbWZzeWxzY3hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYwMjk5MSwiZXhwIjoyMDc1MTc4OTkxfQ.OhbxaDqCLdcalvfBj16pDbi0AIzBZlmXusPkZYlZyzk';

// Name of the table we want to query. Replace this placeholder with an existing table name.
const TABLE_NAME = 'your_table_name';

async function main() {
  // Instantiate an MCP client instance. In a larger application this could manage
  // connections, tools, or resources defined by the MCP specification.
  const mcpClient = new McpClient({
    name: 'supabase-mcp-client',
    description: 'Example MCP client used to interact with Supabase.',
  });

  try {
    // Create a Supabase client using the connection parameters.
    const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY, {
      global: {
        headers: {
          // Attach metadata to identify the MCP client making the request (optional).
          'x-mcp-client-name': mcpClient.name || 'supabase-mcp-client',
        },
      },
    });

    // Execute a SELECT * query against the specified table.
    const { data, error } = await supabase.from(TABLE_NAME).select('*');

    if (error) {
      // Throwing here allows the catch block to handle logging and cleanup.
      throw error;
    }

    // Log the result set to the console so the caller can inspect the rows.
    console.log('Supabase query results:', data);
  } catch (error) {
    // Provide a clear error message without crashing the process.
    console.error('Failed to fetch data from Supabase:', error.message || error);
  } finally {
    // Close the MCP client if the SDK exposes a cleanup method.
    if (typeof mcpClient.close === 'function') {
      await mcpClient.close();
    }
  }
}

// Execute the script and ensure any unexpected errors are logged.
main().catch((error) => {
  console.error('Unexpected error while running the Supabase script:', error);
  process.exit(1);
});
