const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function fetchStudents() {
  const response = await fetch(`${API_URL}/students`);
  return response.json();
}

export async function fetchSchedule() {
  const response = await fetch(`${API_URL}/schedule`);
  return response.json();
}
