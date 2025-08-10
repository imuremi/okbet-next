# Privy Auth `create-next-app` Starter

This is a template for integrating [**Privy Auth**](https://www.privy.io/) into a [NextJS](https://nextjs.org/) project. Check out the deployed app [here](https://create-next-app.privy.io/)!

This demo uses NextJS's [Pages Router](https://nextjs.org/docs/pages/building-your-application/routing). If you'd like to see an example using the [App Router](https://nextjs.org/docs/app), just change the branch of this repository to [`app-router`](https://github.com/privy-io/create-next-app/tree/app-router). 

## Setup

1. Clone this repository and open it in your terminal. 
```sh
git clone https://github.com/privy-io/create-next-app
```

2. Install the necessary dependencies (including [Privy Auth](https://www.npmjs.com/package/@privy-io/react-auth)) with `npm`.
```sh
npm i 
```

3. Initialize your environment variables by copying the `.env.example` file to an `.env.local` file. Then, in `.env.local`, [paste your Privy App ID from the dashboard](https://docs.privy.io/guide/dashboard/api-keys).
```sh
# In your terminal, create .env.local from .env.example
cp .env.example .env.local

# Add your Privy App ID to .env.local
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
```

## Building locally

In your project directory, run `npm run dev`. You can now visit http://localhost:3000 to see your app and login with Privy!


## Check out:
- `pages/_app.tsx` for how to use the `PrivyProvider` and initialize it with your Privy App ID
- `pages/index.tsx` for how to use the `usePrivy` hook and implement a simple `login` button
- `pages/dashboard.tsx` for how to use the `usePrivy` hook, fields like `ready`, `authenticated`, and `user`, and methods like `linkWallet` and `logout`


## Wallet Security & Ownership

This application implements secure wallet creation using Privy's client-side SDKs. **All wallets created through this application are automatically owned by the authenticated user by default.**

### How It Works

1. **Automatic Ownership**: When a user creates a wallet using `useCreateWallet()` or `useSolanaWallets()`, Privy automatically assigns the authenticated user as the wallet owner.

2. **Secure Key Management**: Private keys are securely managed by Privy's infrastructure, not stored locally in the browser.

3. **User Authentication**: Wallets are only created for authenticated users and are tied to their Privy account.

4. **Access Control**: Only the authenticated user can access and control their wallets.

### Security Features

- ✅ **User Ownership**: Every wallet belongs to the authenticated user
- ✅ **Secure Storage**: Private keys are encrypted and stored securely
- ✅ **Account Linking**: Wallets are automatically linked to user accounts
- ✅ **Access Control**: Full user control over all wallet operations
- ✅ **Multi-Factor Authentication**: Support for various authentication methods

### Configuration

The wallet security is configured in `pages/_app.tsx`:

```typescript
embeddedWallets: {
  createOnLogin: "users-without-wallets",
},
```

This ensures that users automatically get wallets created with proper ownership when they log in.

### External vs. Privy Wallets

- **External Wallets** (MetaMask, Phantom): Connected but not owned by your Privy account
- **Privy Wallets**: Created and fully owned by your Privy account

For maximum security and control, use Privy-created wallets rather than connecting external ones.

**Check out [our docs](https://docs.privy.io/) for more guidance around using Privy in your app!**
