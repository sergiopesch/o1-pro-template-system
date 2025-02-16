# Building Apps with the o1 Pro Template System

This is the repo for a free workshop on how to use [OpenAI's o1-pro](https://chatgpt.com/) to build full-stack web apps with a [starter template](https://github.com/mckaywrigley/mckays-app-template).

You can find the video for this workshop on [X]() and [YouTube]().

This workshop is also available in course form on [Takeoff]() - we will continue to add to it and keep it updated with the latest model releases over time.

Use code `O1PRO` for 25% off at checkout.

I get asked all the time for an example of content on Takeoff, so hopefully this workshop gives you a feel for our content and my teaching style.

## About Me

My name is [Mckay](https://www.mckaywrigley.com/).

I'm currently building [Takeoff](https://www.jointakeoff.com/) - the best place in the world to learn how to build with AI.

Follow me on [X](https://x.com/mckaywrigley) and subscribe to my [YouTube](https://www.youtube.com/channel/UCXZFVVCFahewxr3est7aT7Q) for more free AI coding tutorials & guides.

## The Project

In this workshop we will be building ReceiptAI - an intelligent document processing system that automatically extracts and organizes data from receipts and invoices using AI.

This repo's `example` branch ([here]()) has the full example code for a complete version of the project.

## Tech Stack

- AI Model: [o1-pro](https://chatgpt.com/)
- IDE: [Cursor](https://www.cursor.com/)
- AI Tools: [RepoPrompt](https://repoprompt.com/), [V0](https://v0.dev/), [Perplexity](https://www.perplexity.com/)
- Frontend: [Next.js](https://nextjs.org/docs), [Tailwind](https://tailwindcss.com/docs/guides/nextjs), [Shadcn](https://ui.shadcn.com/docs/installation), [Framer Motion](https://www.framer.com/motion/introduction/)
- Backend: [PostgreSQL](https://www.postgresql.org/about/), [Supabase](https://supabase.com/), [Drizzle](https://orm.drizzle.team/docs/get-started-postgresql), [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Auth: [Clerk](https://clerk.com/)
- Payments: [Stripe](https://stripe.com/)

**Note**: While I _highly_ recommend using o1-pro for this workflow, you can also use o3-mini, Claude 3.5 Sonnet, Gemini 2.0 Pro, and DeepSeek r1 for cheaper alternatives. However, you _will_ run into issues with those other models in this particular workflow, so I recommend using o1-pro for this workflow if possible.

## Prerequisites

You will need accounts for the following services.

They all have free plans that you can use to get started, with the exception of ChatGPT Pro (if you are using o1-pro).

- Create a [Cursor](https://www.cursor.com/) account
- Create a [GitHub](https://github.com/) account
- Create a [Supabase](https://supabase.com/) account
- Create a [Clerk](https://clerk.com/) account
- Create a [Stripe](https://stripe.com/) account
- Create a [Vercel](https://vercel.com/) account

You will likely not need paid plans unless you are building a business.

## Guide

### Clone the starter template

1. Clone the [starter template](https://github.com/mckaywrigley/mckays-app-template):

```bash
git clone https://github.com/mckaywrigley/o1-pro-template-system receipt-ai
```

2. Save the original remote as "upstream" before removing it:

```bash
git remote rename origin upstream
```

3. Create a new repository on GitHub

4. Add the new repository as "origin":

```bash
git remote add origin https://github.com/your-username/your-repo-name.git
```

5. Push the new repository:

```
git branch -M main
git push -u origin main
```

### Set up environment variables

1. Copy `.env.example` to `.env.local` and fill in the environment variables

```bash
cp .env.example .env.local
```

```bash
# DB (Supabase)
DATABASE_URL=

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup

# Payments (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY=
```

### Run the app

1. Install dependencies:

```bash
npm install
```

2. Run the app:

```bash
npm run dev
```

3.  View the app on http://localhost:3000
