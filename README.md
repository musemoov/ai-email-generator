# AI Email Generator

An AI-powered email generator using OpenAI's GPT-3.5 Turbo to create professional emails based on user prompts.

## Features

- Email generation with OpenAI's GPT-3.5 Turbo
- User authentication via Supabase
- Modern UI with hover animations
- Token usage tracking
- Sample email prompts

## Setup

### Requirements

- Node.js 18+
- npm or yarn
- OpenAI API Key
- Supabase account

### Environment Variables

1. Create a `.env.local` file in the project root
2. Add the following environment variables:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI API key (no quotes, no trailing spaces)
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXX
```

Note: Replace the placeholder values with your actual API keys.

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## OpenAI API Key Configuration

- The API key must be defined exactly as `OPENAI_API_KEY` in your `.env.local` file
- No quotes or trailing spaces are allowed
- The server must be restarted after making changes to environment variables
- The key is only accessible server-side and never exposed to the client

## Usage

1. Sign up or log in to the application
2. Go to the Email Generation page
3. Enter a prompt describing the email you want to create
4. Click "Generate Email" to create your email
5. View the generated email along with token usage details

## Troubleshooting

- **API Key Issues**: If you see "OpenAI API key is not configured" errors, check your `.env.local` file
- **Authentication Errors**: For "Invalid or expired OpenAI API key" messages, verify your API key is valid
- **Generation Failures**: The application will automatically show error messages with details

## License

MIT

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
