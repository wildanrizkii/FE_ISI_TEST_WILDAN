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

interface TaskLog {
  id: string;
  id_task: string;
  updated_by: string;
  previous_title: string;
  previous_status: string;
  new_title: string;
  new_status: string;
  previous_desc: string;
  new_desc: string;
  updated_at: string;
  created_at: string;
  status: "Task Created" | "Task Updated" | "Task Deleted";
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
  indexOfFirstItem: number;
  indexOfLastItem: number;
  data: TaskLog[];
}

// Pagination Component
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  paginate,
  indexOfFirstItem,
  indexOfLastItem,
  data,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center py-4 px-2 bg-white border-t border-gray-200">
      <div className="text-sm text-gray-500 mb-2 md:mb-0">
        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
        <span className="font-medium">
          {Math.min(indexOfLastItem, data.length)}
        </span>{" "}
        of <span className="font-medium">{data.length}</span> results
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => paginate(page)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === page
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    notStarted: 0,
    onProgress: 0,
    done: 0,
    reject: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [logFilter, setLogFilter] = useState<
    "All" | "Task Created" | "Task Updated" | "Task Deleted"
  >("All");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(5);

  useEffect(() => {
    fetchTasks();
    fetchTaskLogs();
  }, []);

  // Reset to first page when filtering logs
  useEffect(() => {
    setCurrentPage(1);
  }, [logFilter]);

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
          .format("dddd, DD MMMM YYYY [at] HH:mm"),
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

  const fetchTaskLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: { rows: TaskLog[] };
      }> = await axios.get("/api/tasklog/fetch");

      const data = response.data.data.rows.map((log) => ({
        ...log,
        updated_at: dayjs(log?.updated_at)
          .tz("Asia/Jakarta")
          .format("ddd, DD MMMM YYYY [at] HH:mm"),
        created_at: dayjs(log?.created_at)
          .tz("Asia/Jakarta")
          .format("ddd, DD MMMM YYYY [at] HH:mm"),
      }));

      setTaskLogs(data);
    } catch (error) {
      console.error("Error fetching task logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Menghitung persentase
  const completionPercentage =
    statusCounts.total > 0
      ? Math.round((statusCounts.done / statusCounts.total) * 100)
      : 0;

  // Filter task logs berdasarkan status
  const filteredLogs =
    logFilter === "All"
      ? taskLogs
      : taskLogs.filter((log) => log.status === logFilter);

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Function to change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
          onClick={() => {
            fetchTasks();
            fetchTaskLogs();
          }}
          disabled={isLoading || isLoadingLogs}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center transition-all disabled:opacity-70"
        >
          <svg
            className={`w-4 h-4 mr-2 ${
              isLoading || isLoadingLogs ? "animate-spin" : ""
            }`}
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
          {isLoading || isLoadingLogs ? "Memperbarui..." : "Refresh Data"}
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

      <div className="grid grid-cols-1 gap-6 mb-6">
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

      {/* Task Log Table */}
      <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Task Activity Log
            </h3>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">Filter:</span>
              <select
                className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={logFilter}
                onChange={(e) =>
                  setLogFilter(
                    e.target.value as
                      | "All"
                      | "Task Created"
                      | "Task Updated"
                      | "Task Deleted"
                  )
                }
              >
                <option value="All">All Activities</option>
                <option value="Task Created">Created</option>
                <option value="Task Updated">Updated</option>
                <option value="Task Deleted">Deleted</option>
              </select>
            </div>
          </div>

          {isLoadingLogs ? (
            <div className="flex justify-center items-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-gray-500"
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
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activity logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 shadow-sm">
                  <thead className="bg-gray-100 text-gray-600 text-sm">
                    <tr>
                      <th className="px-4 py-2 text-start">Title</th>
                      <th className="px-4 py-2 text-start">Description</th>
                      <th className="px-4 py-2 text-start">Updated by</th>
                      <th className="px-4 py-2 text-start">Status</th>
                      <th className="px-4 py-2 text-start">Time</th>
                      <th className="px-4 py-2 text-start">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-start">
                    {currentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log.status === "Task Created"
                            ? log.previous_title
                            : log.new_title}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-24 truncate">
                          {log.status === "Task Created"
                            ? log.previous_desc
                            : log.new_desc}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log?.updated_by}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log.status === "Task Created"
                            ? log.previous_status
                            : log.new_status}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log.status === "Task Created"
                            ? log?.created_at
                            : log?.updated_at}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full text-nowrap
                ${
                  log.status === "Task Created"
                    ? "bg-cyan-100 text-cyan-700"
                    : log.status === "Task Updated"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Component */}
              {filteredLogs.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  paginate={paginate}
                  indexOfFirstItem={indexOfFirstItem}
                  indexOfLastItem={indexOfLastItem}
                  data={filteredLogs}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
