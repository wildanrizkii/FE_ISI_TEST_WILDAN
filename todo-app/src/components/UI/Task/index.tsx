"use client";
import React, { useState, useEffect } from "react";
import axios, { AxiosResponse } from "axios";
import {
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaCalendarAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { AiOutlinePlus, AiOutlineDown, AiOutlineClose } from "react-icons/ai";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import { showNotification } from "@/app/utils/notification";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  created_by: number;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
  indexOfFirstItem: number;
  indexOfLastItem: number;
  data: Task[];
}

interface StatusConfig {
  color: string;
  icon: React.ReactNode;
  label: string;
}

const Task: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: string;
  }>({
    title: "",
    description: "",
    status: "Not Started",
  });
  const [editTask, setEditTask] = useState<{
    id: number;
    title: string;
    description: string;
    status: string;
  }>({
    id: 0,
    title: "",
    description: "",
    status: "Not Started",
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(5);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Status config
  const statusConfigs: Record<string, StatusConfig> = {
    Done: {
      color: "text-green-700 bg-green-100 border-green-200",
      icon: <FaCheckCircle className="mr-1" />,
      label: "Done",
    },
    Reject: {
      color: "text-red-700 bg-red-100 border-red-200",
      icon: <FaTimesCircle className="mr-1" />,
      label: "Rejected",
    },
    "Not Started": {
      color: "text-amber-700 bg-amber-100 border-amber-200",
      icon: <FaExclamationTriangle className="mr-1" />,
      label: "Not Started",
    },
    "On Progress": {
      color: "text-cyan-700 bg-cyan-100 border-cyan-200",
      icon: <FaHourglassHalf className="mr-1" />,
      label: "In Progress",
    },
  };

  const fetchTasks = async (): Promise<void> => {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: { rows: Task[] };
      }> = await axios.get("/api/tasks/fetch");

      const data = response.data.data.rows.map((task) => ({
        ...task,
        created_at: dayjs(task?.created_at)
          .tz("Asia/Jakarta")
          .format("dddd, DD MMMM YYYY"),
      }));

      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    try {
      if (newTask.title.trim() === "" || newTask.description.trim() === "") {
        showNotification.error("Task title and description cannot be empty");
        return;
      }

      const loadingToastId = showNotification.loading("Adding task...");

      const response: AxiosResponse<{ success: boolean; data: Task }> =
        await axios.post("/api/tasks/add", {
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          created_by: 1,
        });

      showNotification.dismiss(loadingToastId);

      if (response.data.success) {
        showNotification.success("Task added successfully!");
        setTasks([...tasks, response.data.data]);
        setNewTask({ title: "", description: "", status: "Not Started" });
        setIsDrawerOpen(false);
      } else {
        showNotification.error("Failed to add task");
      }
    } catch (error) {
      showNotification.error("An error occurred while adding the task");
      console.error("Error adding task:", error);
    } finally {
      fetchTasks();
    }
  };

  const handleEditTask = async () => {
    try {
      if (editTask.title.trim() === "" || editTask.description.trim() === "") {
        showNotification.error("Task title and description cannot be empty");
        return;
      }

      const loadingToastId = showNotification.loading("Updating task...");

      const response: AxiosResponse<{ success: boolean; data: Task }> =
        await axios.put(`/api/tasks/edit`, {
          id: editTask.id,
          title: editTask.title,
          description: editTask.description,
          status: editTask.status,
        });

      showNotification.dismiss(loadingToastId);

      if (response.data.success) {
        showNotification.success("Task updated successfully!");
        setIsEditing(false);
        setSelectedTask(null);
        fetchTasks();
      } else {
        showNotification.error("Failed to update task");
      }
    } catch (error) {
      showNotification.error("An error occurred while updating the task");
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async () => {
    try {
      if (taskToDelete) {
        const loadingToastId = showNotification.loading("Deleting task...");

        const response: AxiosResponse<{ success: boolean }> =
          await axios.delete(`/api/tasks/delete/${taskToDelete}`);

        showNotification.dismiss(loadingToastId);

        if (response.data.success) {
          showNotification.success("Task deleted successfully!");
          setTasks(tasks.filter((task) => task?.id !== taskToDelete));
          setIsDeleting(false);
          setTaskToDelete(null);
        } else {
          showNotification.error("Failed to delete task");
        }
      }
    } catch (error) {
      showNotification.error("An error occurred while deleting the task");
      console.error("Error deleting task:", error);
    }
  };

  const getStatusColor = (status: string): string => {
    return (
      statusConfigs[status]?.color ||
      "text-gray-700 bg-gray-100 border-gray-200"
    );
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    return statusConfigs[status]?.icon || null;
  };

  const startEditTask = (task: Task) => {
    setEditTask({
      id: task?.id,
      title: task?.title,
      description: task?.description,
      status: task?.status,
    });
    setIsEditing(true);
    setSelectedTask(null);
  };

  const startDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId);
    setIsDeleting(true);
    setSelectedTask(null);
  };

  // Filtering logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || task?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Logic untuk Pagination
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentTasks: Task[] = filteredTasks.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages: number = Math.ceil(filteredTasks.length / itemsPerPage);

  const paginate = (pageNumber: number): void => {
    setCurrentPage(pageNumber);
    setSelectedTask(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        selectedTask !== null &&
        !(e.target as Element).closest(".task-dropdown")
      ) {
        setSelectedTask(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [selectedTask]);

  return (
    mounted && (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Task Manager</h2>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center bg-purple-600 hover:bg-purple-700 transition-colors text-white px-4 py-2 rounded-md shadow-sm"
          >
            <AiOutlinePlus className="mr-2" /> Add Task
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-300 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <AiOutlineClose />
              </button>
            )}
          </div>
          <div className="relative min-w-[180px]">
            <select
              className="w-full appearance-none p-2 pl-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-300 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="On Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Reject">Rejected</option>
            </select>
            <AiOutlineDown className="w-4 h-4 text-zinc-600 absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Empty State */}
        {currentTasks.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-2">No tasks found</p>
            <p className="text-sm text-gray-400">
              {filteredTasks.length === 0
                ? "Try adding a new task or adjusting your filters"
                : "Try a different page or adjust your filters"}
            </p>
          </div>
        )}

        {/* Task List */}
        <ul className="space-y-4">
          {currentTasks.map((task) => (
            <li
              key={task?.id}
              className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-grow mr-4">
                  <div className="flex flex-wrap items-start gap-2">
                    <h3 className="text-lg font-semibold text-gray-800 mr-2">
                      {task?.title}
                    </h3>
                    <span
                      className={`px-2.5 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full border ${getStatusColor(
                        task?.status
                      )}`}
                    >
                      {getStatusIcon(task?.status)}
                      {statusConfigs[task?.status]?.label || task?.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {task?.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <FaCalendarAlt className="mr-1" />
                    <span>{task?.created_at}</span>
                  </div>
                </div>
                <div className="relative task-dropdown">
                  <button
                    onClick={() =>
                      setSelectedTask(
                        selectedTask === task?.id ? null : task?.id
                      )
                    }
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                  >
                    <FaEllipsisV />
                  </button>
                  {selectedTask === task?.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-400 rounded-md shadow-md z-10">
                      <button
                        className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 hover:rounded-md text-sm"
                        onClick={() => startEditTask(task)}
                      >
                        <FaEdit className="mr-2 text-blue-500" /> Edit
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 hover:rounded-md text-sm"
                        onClick={() => startDeleteTask(task?.id)}
                      >
                        <FaTrash className="mr-2 text-red-500" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Pagination Component */}
        {filteredTasks.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            paginate={paginate}
            indexOfFirstItem={indexOfFirstItem}
            indexOfLastItem={indexOfLastItem}
            data={filteredTasks}
          />
        )}

        {/* Add Task Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 bg-black/70 flex justify-end z-50">
            <div
              className="bg-white w-full sm:w-2/3 md:w-1/2 lg:w-1/3 h-full p-6 space-y-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Create New Task</h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <AiOutlineClose className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Input task title"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-300 focus:outline-none"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    placeholder="Task Description"
                    className="w-full p-2 border rounded-md min-h-[120px] max-h-[300px] resize-y focus:ring-2 focus:ring-purple-300 focus:border-purple-300 focus:outline-none"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {newTask.description.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="relative w-full">
                    <select
                      className="w-full appearance-none p-2 pr-8 border rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-300 focus:outline-none"
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask({ ...newTask, status: e.target.value })
                      }
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="On Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="Reject">Rejected</option>
                    </select>
                    <AiOutlineDown className="w-4 h-4 text-zinc-600 absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t mt-6">
                <button
                  onClick={() => {
                    setNewTask({
                      title: "",
                      description: "",
                      status: "Not Started",
                    });
                    setIsDrawerOpen(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  disabled={
                    !newTask.title.trim() || !newTask.description.trim()
                  }
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div
              className="bg-white w-full max-w-md p-6 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Edit Task</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <AiOutlineClose className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-300 focus:outline-none"
                    value={editTask.title}
                    onChange={(e) =>
                      setEditTask({ ...editTask, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[120px] resize-y focus:ring-2 focus:ring-purple-300 focus:outline-none"
                    value={editTask.description}
                    onChange={(e) =>
                      setEditTask({
                        ...editTask,
                        description: e.target.value,
                      })
                    }
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {editTask.description.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="relative w-full">
                    <select
                      className="w-full appearance-none p-2 pr-8 border rounded-md focus:ring-2 focus:ring-purple-300 focus:outline-none"
                      value={editTask.status}
                      onChange={(e) =>
                        setEditTask({ ...editTask, status: e.target.value })
                      }
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="On Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="Reject">Rejected</option>
                    </select>
                    <AiOutlineDown className="w-4 h-4 text-zinc-600 absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTask}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  disabled={
                    !editTask.title.trim() || !editTask.description.trim()
                  }
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleting && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div
              className="bg-white w-full max-w-sm p-6 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleting(false);
                    setTaskToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  );
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  paginate,
  indexOfFirstItem,
  indexOfLastItem,
  data,
}) => {
  const generatePageNumbers = (): (number | string)[] => {
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 5) {
      pageNumbers.push(...Array.from({ length: totalPages }, (_, i) => i + 1));
    } else {
      pageNumbers.push(1);

      if (currentPage > 3) pageNumbers.push("...");

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      pageNumbers.push(
        ...Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        )
      );

      if (currentPage < totalPages - 2) pageNumbers.push("...");

      if (totalPages > 1) pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-0 py-4 border-t border-gray-200 mt-6">
      <div className="text-sm text-gray-500 mb-3 sm:mb-0">
        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> -{" "}
        <span className="font-medium">
          {Math.min(indexOfLastItem, data.length)}
        </span>{" "}
        of <span className="font-medium">{data.length}</span> results
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-center inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>

        <div className="hidden md:flex space-x-1">
          {generatePageNumbers().map((number, index) => (
            <button
              key={index}
              onClick={() => typeof number === "number" && paginate(number)}
              disabled={number === "..."}
              className={`text-center inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-md ${
                currentPage === number
                  ? "z-10 bg-purple-600 text-white border-purple-600"
                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              } ${number === "..." ? "cursor-default" : ""}`}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-center inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Task;
