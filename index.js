// index.js
// Script demonstrating how to connect to Supabase via the MCP Client SDK.

// The original example relied on the Model Context Protocol SDK which is not
// currently published on npm under the expected version. To keep the example
// script functional without blocking installs we provide a lightweight stub
// that mimics the client features required below.
class McpClient {
  constructor(options = {}) {
    this.name = options.name || 'supabase-mcp-client';
    this.description = options.description || '';
  }

  async close() {
    // No-op stub retained for API parity with the real SDK.
  }
}
// Import the official Supabase client library for executing queries against the database.
const { createClient } = require('@supabase/supabase-js');

// Define the Supabase connection parameters required to authenticate with the REST API.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

// Name of the table we want to query. Provide this through an environment variable so
// the script can target any table without editing source code.
const TABLE_NAME = process.env.SUPABASE_TABLE_NAME;

function validateConfiguration() {
  const missing = [];

  if (!SUPABASE_URL) {
    missing.push('SUPABASE_URL');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!TABLE_NAME) {
    missing.push('SUPABASE_TABLE_NAME');
  }

  if (missing.length > 0) {
    console.error(
      `Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(
        ', '
      )}. Please configure these values before running the script.`
    );
    return false;
  }

  return true;
}

async function main() {
  // Instantiate an MCP client instance. In a larger application this could manage
  // connections, tools, or resources defined by the MCP specification.
  const mcpClient = new McpClient({
    name: 'supabase-mcp-client',
    description: 'Example MCP client used to interact with Supabase.',
  });

  try {
    if (!validateConfiguration()) {
      return;
    }

    // Create a Supabase client using the connection parameters.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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
