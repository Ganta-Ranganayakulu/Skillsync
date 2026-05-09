import axios from "axios";

const API = axios.create({
  baseURL: "https://skillsync-backend1.onrender.com"
});

export default API;
