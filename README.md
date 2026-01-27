# The Curator

AI-powered Slack insights for engineering managers. Get summaries of team activity, sentiment analysis, and communication pattern detection to help you stay connected with your team.

## Features

- **Team Insights**: Monitor individual team member activity, sentiment, and communication patterns
- **Company Insights**: Summarize channel activity across your organization with filterable action items and highlights
- **To-Do Management**: Track action items from insights, mark them complete, and stay on top of follow-ups
- **Custom Team Groups**: Create and manage your own team groupings (e.g., "Sales Engineers", "Leadership")
- **Custom Channel Categories**: Define categories for your channels (e.g., "HQ", "Sales", "Support")
- **Sentiment Analysis**: Detect positive, negative, or mixed sentiment in communications
- **Communication Tone Detection**: Identify early warning signals like terseness or tension
- **1:1 Preparation**: Get suggested topics for your next 1:1 based on recent activity
- **Slack Deep Links**: Click through to original messages for full context

## Prerequisites

Before you begin, you'll need:

1. A [Vercel](https://vercel.com) account
2. A Slack workspace where you have permission to create apps
3. Node.js 18+ installed locally (for development)

## Setup

### 1. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bseymour/The-Curator-v4)

Or clone and deploy manually:

```bash
git clone https://github.com/bseymour/The-Curator-v4.git
cd The-Curator-v4
npm install
vercel
```

### 2. Set Up Upstash Redis (KV Storage)

The Curator uses Upstash Redis to store your configuration (tracked channels and team members).

#### Option A: Via Vercel Integration (Recommended)

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → **KV (Upstash)**
4. Follow the prompts to create a new KV database
5. The environment variables `KV_REST_API_URL` and `KV_REST_API_TOKEN` will be automatically added

#### Option B: Manual Setup

1. Create an account at [Upstash](https://upstash.com)
2. Create a new Redis database
3. Copy the REST API credentials
4. Add to your Vercel project environment variables:
   - `KV_REST_API_URL` - Your Upstash Redis REST URL
   - `KV_REST_API_TOKEN` - Your Upstash Redis REST token

### 3. Set Up Slack App

You need to create a Slack app to access your workspace's messages.

#### Create the Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Name it "The Curator" (or your preferred name)
4. Select your workspace

#### Configure OAuth Scopes

1. In your app settings, go to **OAuth & Permissions**
2. Under **User Token Scopes**, add the following scopes:

| Scope | Purpose |
|-------|---------|
| `channels:history` | Read messages from public channels |
| `channels:read` | List public channels |
| `groups:history` | Read messages from private channels |
| `groups:read` | List private channels |
| `search:read` | Search messages (for team member activity) |
| `users:read` | Get user information |
| `users:read.email` | Get user email addresses |

> **Note**: We use **User Token Scopes** (not Bot Token Scopes) because the app needs to access channels and search on behalf of a user. The user installing the app must have access to the channels they want to monitor.

#### Install to Workspace

1. Go to **Install App** in the sidebar
2. Click **Install to Workspace**
3. Review and authorize the permissions
4. Copy the **User OAuth Token** (starts with `xoxp-`)

#### Add Environment Variable

Add the token to your Vercel project:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - Name: `SLACK_USER_OAUTH_TOKEN`
   - Value: Your `xoxp-...` token

### 4. Set Up AI Gateway (Vercel AI)

The Curator uses Vercel's AI Gateway for generating summaries and analysis.

#### Enable AI Gateway

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **AI**
3. Enable the AI Gateway
4. The gateway is preconfigured to work with multiple AI providers

#### Supported Models

The app uses the AI SDK with Vercel AI Gateway, which supports:
- OpenAI (GPT-4, GPT-4o, etc.)
- Anthropic (Claude)
- And other providers

The default configuration uses the gateway's automatic routing. No additional API keys are required if you're using the Vercel AI Gateway.

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_USER_OAUTH_TOKEN` | Yes | Slack User OAuth token (xoxp-...) |
| `KV_REST_API_URL` | Yes | Upstash Redis REST API URL |
| `KV_REST_API_TOKEN` | Yes | Upstash Redis REST API token |

## Usage

### First-Time Setup

1. Open the app and navigate to **Settings**
2. Create your channel categories (optional but recommended):
   - Examples: "HQ", "Sales", "Engineering", "Support"
   - These help organize your channel insights
3. Add channels you want to monitor:
   - Search for channels by name
   - Assign them to your custom categories
4. Create team groups (optional but recommended):
   - Examples: "Sales Engineers", "Managers", "My Direct Reports"
   - Assign team members to groups for filtered insights
5. Add team members you want to track:
   - Search for users by name
   - Set their role (IC/Manager) and relationship to you (Direct Report/Skip)

### Viewing Insights

- **Home** (`/`): Overview dashboard with quick access to all features
- **Team Insights** (`/team`): View activity summaries, sentiment, and communication patterns for each team member. Filter by team groups.
- **Company Insights** (`/company`): View channel summaries with filterable action items and highlights. Add items directly to your to-do list.
- **To-Dos** (`/todos`): Manage action items from insights. Mark complete, delete, or add new items manually.

### Time Ranges

Select different time ranges for analysis:
- Last 24 hours
- Last 7 days
- Last 14 days
- Last 30 days
- Specific week (for historical analysis)

## Privacy Considerations

- The app only accesses channels that the installing user is a member of
- All data is processed through Vercel's AI Gateway
- Configuration is stored in your own Upstash Redis instance
- No message content is stored permanently; it's only used for real-time analysis

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### "SLACK_USER_OAUTH_TOKEN is not configured"

Make sure you've added the `SLACK_USER_OAUTH_TOKEN` environment variable in Vercel and redeployed.

### "Channel not found or not accessible"

The user whose OAuth token is being used must be a member of the channel. Join the channel in Slack and try again.

### "No messages found"

- The channel may have no recent activity in the selected time range
- Try selecting a longer time range

### Rate Limiting

Slack has rate limits on API calls. If you're monitoring many channels or team members, you may occasionally see rate limit errors. The app will retry automatically.

## License

MIT
