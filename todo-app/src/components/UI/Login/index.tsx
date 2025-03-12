"use client";
import { useEffect, useRef, useState, FormEvent } from "react";
import { signIn, useSession } from "next-auth/react";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { MdOutlineAlternateEmail } from "react-icons/md";
import { CgLock } from "react-icons/cg";
import { showNotification } from "@/app/utils/notification";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";

const Login = () => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    try {
      setIsLoading(true);
      if (email.length >= 4 && password.length >= 4) {
        const loadingToastId = showNotification.loading("Logging in...");

        const response = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false,
        });

        showNotification.dismiss(loadingToastId);

        if (response?.error) {
          showNotification.error("Invalid email or password");
        } else {
          showNotification.success("Login successful!");
          router.push("/");
        }
      } else {
        showNotification.error(
          "Email and password must be at least 4 characters"
        );
      }
    } catch (error) {
      showNotification.error("An error occurred while logging in");
      console.error("Error on routes", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheck = async (): Promise<void> => {
    try {
      const hash = await bcrypt.hash("lead123", 10);
      console.log(hash);
    } catch (error) {
      console.error("Error on routes", error);
    }
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  return mounted ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden grid">
        <div className="px-8 sm:px-10 md:px-8 py-12">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-emerald-600">Todo App</div>
            <h1 className="text-gray-500 pt-4">Please enter your details</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MdOutlineAlternateEmail className="text-gray-400 text-lg" />
                </div>
                <input
                  autoComplete="off"
                  type="text"
                  id="email"
                  placeholder="Email / Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-200 p-2.5 pl-10 shadow-sm text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  style={{ minHeight: "40px" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <CgLock className="text-gray-400 text-lg" />
                </div>
                <input
                  autoComplete="off"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-200 p-2.5 pl-10 pr-10 shadow-sm text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  style={{ minHeight: "40px" }}
                />
                <div
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <FiEyeOff className="text-gray-400 text-lg" />
                  ) : (
                    <FiEye className="text-gray-400 text-lg" />
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-10 bg-emerald-700 text-white py-2 rounded-md text-sm hover:bg-emerald-800 transition-all flex items-center justify-center ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  ) : null;
};

export default Login;
