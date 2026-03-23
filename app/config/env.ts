export const env = {
    unsplash: {
        accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ?? "",
        secretKey: process.env.NEXT_PUBLIC_UNSPLASH_SECRET_KEY ?? "",
    },
} as const;