import { BrowserRouter, Link, Route, Routes } from "react-router-dom"
import StudentPage from "./pages/StudentPage"
import AdminPage from "./pages/AdminPage"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<StudentPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route
                    path="*"
                    element={
                        <main className="flex min-h-svh flex-col items-center justify-center gap-5 p-[30px] text-center">
                            <span className="text-wine text-xs font-semibold tracking-[1.7px]">
                                404 · PAGE NOT FOUND
                            </span>
                            <h1 className="text-wine font-serif text-[45px]">
                                Let’s get you back.
                            </h1>
                            <p className="text-[15px] text-[#77757d]">
                                The page you’re looking for doesn’t exist.
                            </p>
                            <Link
                                className="bg-wine hover:bg-wine-dark inline-flex min-h-[42px] items-center justify-center rounded-[7px] px-[17px] py-[11px] text-sm font-semibold text-white transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#bb667d]"
                                to="/"
                            >
                                Go to student check-in
                            </Link>
                        </main>
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}
