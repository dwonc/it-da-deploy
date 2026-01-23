// src/App.tsx
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";

// ✅ 핵심: router "객체"를 가져와야 합니다 (컴포넌트 아님)
import router from "./router/index";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
        },
    },
});

export default function App(): React.ReactElement {
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster position="top-right" />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
