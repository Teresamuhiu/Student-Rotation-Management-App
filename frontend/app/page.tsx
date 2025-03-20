"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
  shift?: string; // Optional shift field
}

interface Schedule {
  student_id: number;
  student_name: string;
  date?: string;
  shift?: string;
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    role: "",
    shift: "",
  });
  const [search, setSearch] = useState(""); // Search state

  useEffect(() => {
    fetch(`${API_URL}/students`)
      .then((res) => res.json())
      .then((data) => setStudents(data));

    fetch(`${API_URL}/schedule`)
      .then((res) => res.json())
      .then((data) => setSchedule(data));
  }, []);

  // Function to Add a Student
  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.role) {
      alert("Please enter Name, Email, and Role!");
      return;
    }

    const studentData = {
      name: newStudent.name,
      email: newStudent.email,
      role: newStudent.role,
      shift: newStudent.shift || null, // Allow empty shift
    };

    try {
      const res = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });

      const data = await res.json();

      if (res.ok) {
        setStudents([...students, { id: students.length + 1, ...studentData }]);

        // Update schedule if shift was provided
        if (newStudent.shift) {
          setSchedule([
            ...schedule,
            {
              student_id: students.length + 1,
              student_name: newStudent.name,
              shift: newStudent.shift,
            },
          ]);
        }

        setNewStudent({ name: "", email: "", role: "", shift: "" }); // Clear form
      } else {
        console.error("Failed to add student:", data);
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Something went wrong! Check console logs.");
    }
  };

  // Function to Delete a Student
  const handleDeleteStudent = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/students/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStudents(students.filter((student) => student.id !== id));
        setSchedule(schedule.filter((entry) => entry.student_id !== id)); // Remove from schedule
      } else {
        console.error("Failed to delete student");
        alert("Error deleting student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Something went wrong!");
    }
  };

  const handleAssignShift = async (studentId: number, shift: string) => {
    // Ensure the student is not already in the schedule
    if (
      schedule.some((entry) => entry.student_id === studentId && entry.shift)
    ) {
      alert("This student already has a shift assigned!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/students/${studentId}/assign_shift`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift }),
      });

      if (res.ok) {
        setStudents(
          students.map((student) =>
            student.id === studentId ? { ...student, shift } : student
          )
        );

        // Prevent duplicate schedule entries
        setSchedule((prevSchedule) => {
          if (prevSchedule.some((entry) => entry.student_id === studentId)) {
            return prevSchedule.map((entry) =>
              entry.student_id === studentId ? { ...entry, shift } : entry
            );
          } else {
            const updatedStudent = students.find(
              (student) => student.id === studentId
            );
            if (updatedStudent) {
              return [
                ...prevSchedule,
                {
                  student_id: studentId,
                  student_name: updatedStudent.name,
                  shift,
                },
              ];
            }
            return prevSchedule;
          }
        });
      } else {
        alert("Failed to assign shift");
      }
    } catch (error) {
      console.error("Error assigning shift:", error);
    }
  };

  // Search Filtering
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } min-h-screen p-6`}
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        {/* Dark Mode Toggle */}
        <button
          className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-md transition mb-4"
          onClick={() => setDarkMode(!darkMode)}
        >
          Toggle Dark Mode
        </button>

        <h1 className="text-3xl font-bold text-center mb-6 text-black dark:text-white">
          Student Rotation Management
        </h1>

        {/* Search Students */}
        <input
          type="text"
          placeholder="Search students..."
          className="p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white mb-4 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Students Table */}
        <h2 className="text-xl font-semibold mb-3 text-black dark:text-white">
          Students
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 shadow-sm rounded-lg">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Role</th>
                <th className="border p-3 text-left">Shift</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <td className="border p-3 text-gray-900 dark:text-white">
                    {student.name}
                  </td>
                  <td className="border p-3 text-gray-900 dark:text-white">
                    {student.email}
                  </td>
                  <td className="border p-3 text-gray-900 dark:text-white">
                    {student.role}
                  </td>
                  <td className="border p-3 text-gray-900 dark:text-white">
                    {schedule.some(
                      (entry) => entry.student_id === student.id && entry.shift
                    ) ? (
                      student.shift
                    ) : (
                      <select
                        className="p-1 border rounded text-black"
                        onChange={(e) =>
                          handleAssignShift(student.id, e.target.value)
                        }
                      >
                        <option value="">Assign Shift</option>
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Night">Night</option>
                      </select>
                    )}
                  </td>

                  <td className="border p-3">
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Student Form */}
        <h3 className="text-lg font-semibold mt-6 text-black dark:text-white">
          Add New Student
        </h3>
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <input
            type="text"
            placeholder="Name"
            className="p-2 border rounded flex-1 min-w-[150px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
            value={newStudent.name}
            onChange={(e) =>
              setNewStudent({ ...newStudent, name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Email"
            className="p-2 border rounded flex-1 min-w-[150px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
            value={newStudent.email}
            onChange={(e) =>
              setNewStudent({ ...newStudent, email: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Role"
            className="p-2 border rounded flex-1 min-w-[150px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
            value={newStudent.role}
            onChange={(e) =>
              setNewStudent({ ...newStudent, role: e.target.value })
            }
          />

          {/* Shift Dropdown */}
          <select
            className="p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white flex-1 min-w-[120px]"
            value={newStudent.shift}
            onChange={(e) =>
              setNewStudent({ ...newStudent, shift: e.target.value })
            }
          >
            <option value="">Select Shift (Optional)</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Night">Night</option>
          </select>

          <button
            className="px-4 py-2 bg-green-500 text-white rounded"
            onClick={handleAddStudent}
          >
            Add Student
          </button>
        </div>

        {/* Schedule Table */}
        <h2 className="text-xl font-semibold mt-6 mb-3 text-black dark:text-white">
          Schedule
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 shadow-sm rounded-lg">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                <th className="border p-3 text-left">Student</th>
                <th className="border p-3 text-left">Shift</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((entry, index) => (
                <tr
                  key={`${entry.student_id}-${index}`}
                  className="hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <td className="border p-3 text-gray-900 dark:text-white">
                    {entry.student_name}
                  </td>
                  <td className="border p-3 text-gray-900 dark:text-white">
                    {entry.shift || "Not Assigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
