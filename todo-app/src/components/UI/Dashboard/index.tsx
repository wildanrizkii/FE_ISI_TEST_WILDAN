"use client";
import React, { useState, useEffect } from "react";
import axios, { AxiosResponse } from "axios";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Task {
  id: string;
  title: string;
  description: string;
  status: "Not Started" | "On Progress" | "Done" | "Reject";
  created_at: string;
}

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    notStarted: 0,
    onProgress: 0,
    done: 0,
    reject: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: { rows: Task[] };
      }> = await axios.get("/api/tasks/fetch");

      const data = response.data.data.rows.map((task) => ({
        ...task,
        created_at: dayjs(task.created_at)
          .tz("Asia/Jakarta")
          .format("dddd, DD MMMM YYYY"),
      }));

      setTasks(data);

      // Kalkulasikan untuk setiap status
      const counts = {
        total: data.length,
        notStarted: data.filter((task) => task.status === "Not Started").length,
        onProgress: data.filter((task) => task.status === "On Progress").length,
        done: data.filter((task) => task.status === "Done").length,
        reject: data.filter((task) => task.status === "Reject").length,
      };

      setStatusCounts(counts);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Menghitung persentase
  const completionPercentage =
    statusCounts.total > 0
      ? Math.round((statusCounts.done / statusCounts.total) * 100)
      : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage your tasks easily
          </p>
        </div>
        <button
          onClick={fetchTasks}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-all disabled:opacity-70"
        >
          <svg
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isLoading ? "Memperbarui..." : "Refresh Data"}
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Task Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-3">
                  <svg
                    className="h-8 w-8"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Task
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {statusCounts.total}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 text-purple-600 rounded-full p-3">
                  <svg
                    className="h-8 w-8"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Not Started
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {statusCounts.notStarted}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">
                        {statusCounts.total > 0
                          ? `(${Math.round(
                              (statusCounts.notStarted / statusCounts.total) *
                                100
                            )}%)`
                          : "(0%)"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 text-yellow-600 rounded-full p-3">
                  <svg
                    className="h-8 w-8"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      On Progress
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {statusCounts.onProgress}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">
                        {statusCounts.total > 0
                          ? `(${Math.round(
                              (statusCounts.onProgress / statusCounts.total) *
                                100
                            )}%)`
                          : "(0%)"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex flex-col">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 bg-green-100 text-green-600 rounded-full p-3">
                    <svg
                      className="h-8 w-8"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Done
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">
                          {statusCounts.done}
                        </div>
                        <div className="ml-2 text-sm text-gray-500">
                          ({completionPercentage}%)
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Status Summary
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">
                    Not Started
                  </span>
                  <span className="text-sm font-medium text-purple-600">
                    {statusCounts.notStarted} task
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${
                        statusCounts.total > 0
                          ? (statusCounts.notStarted / statusCounts.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">
                    On Progress
                  </span>
                  <span className="text-sm font-medium text-yellow-600">
                    {statusCounts.onProgress} task
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${
                        statusCounts.total > 0
                          ? (statusCounts.onProgress / statusCounts.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">
                    Done
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {statusCounts.done} task
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        statusCounts.total > 0
                          ? (statusCounts.done / statusCounts.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">
                    Reject
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    {statusCounts.reject} task
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${
                        statusCounts.total > 0
                          ? (statusCounts.reject / statusCounts.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
