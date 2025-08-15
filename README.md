![Zen Flow Logo](public/zenlogo.png)

# 🚀 Zen Flow

A modern social media platform designed to provide a pure, undisturbed information flow and a high-quality interactive experience.

## 💡 Core Philosophy & Selling Points

The name **Zen Flow** perfectly captures the core philosophy: Zen represents tranquility, focus, and freedom from interference; Flow implies a natural, smooth, and chronologically ordered information stream. It imbues the product with soul.

We are committed to creating a unique social experience:

*   **"Anti-Algorithm" and "Chronological Feed"**:
    On our platform, what you see is always strictly in the chronological order of posts. There is no algorithm interference, no "you might like," only the most authentic time flow.

*   **Enhanced "Stress-Free Exploration" and "Guest Mode"**:
    Explore first, then decide. We believe good content will make you want to stay. You can browse all public content undisturbed until you genuinely wish to interact, then easily join. There are no "please log in/register" pop-ups or overlays to interrupt the experience.

*   **Encouraging "High-Quality Interaction," Not "Traffic Secrets"**:
    We value meaningful exchanges. Here, a thoughtful comment is worth more than a thousand meaningless likes. We encourage deep content and meaningful reactions.

## ✨ Key Features

*   **Pure Chronological Feed**: Content is displayed strictly by publication time, without algorithm interference.
*   **Stress-Free Guest Mode**: Browse all public content without logging in; login/registration is only prompted when attempting to interact.
*   **Diverse Posts**: Supports text and multi-image posts.
*   **Rich Interactions**:
    *   **Meaningful Reactions**: Beyond "Like," we offer more specific reactions like "Insightful," "Thanks," and "Haha."
    *   **Author-Highlighted Comments**: Post authors can "pin" or "highlight" the most insightful comments.
*   **User Following & Request Management**: Establish and manage social connections.
*   **Responsive Design**: Provides a smooth experience on mobile, tablet, and desktop devices.

## 🛠️ Technologies Used

*   **Core Framework**: [Next.js](https://nextjs.org/) (React)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database ORM**: [Prisma](https://www.prisma.io/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/)
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Auth.js)
*   **UI/CSS**: [Tailwind CSS](https://tailwindcss.com/)
*   **Component Libraries**: [Swiper.js](https://swiperjs.com/) (Image Carousel), [Sonner](https://sonner.emilkowalski.com/) (Toast Notifications), [Heroicons](https://heroicons.com/) (SVG Icons)
*   **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   [Node.js](https://nodejs.org/en/) (v18.x or higher)
*   [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
*   [Git](https://git-scm.com/)
*   [PostgreSQL](https://www.postgresql.org/) database instance

### Database Setup

1.  **Configure Environment Variables**:
    Create a `.env` file in the project root and fill in the necessary environment variables:

    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET_HERE" # Generate using `openssl rand -base64 32`
    NEXTAUTH_URL="http://localhost:3000"

    # If using OAuth providers, add corresponding variables, e.g.:
    # GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
    # GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
    ```
    Please replace `DATABASE_URL` with your local PostgreSQL database connection string.

2.  **Run Database Migrations**:
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Seed Initial Data (Optional)**:
    ```bash
    npm run db:seed
    ```

## Deployment

This project can be easily deployed to [Vercel](https://vercel.com/). Ensure all necessary environment variables are configured in your Vercel project settings, and set the build command to:

```
npx prisma generate && npx prisma migrate deploy && next build
```

## 🤝 Contributing

Contributions are welcome! If you have any suggestions or find bugs, feel free to submit an Issue or Pull Request.

## 📄 License

This project is released under the MIT License.
