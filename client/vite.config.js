import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import envCompatible from "vite-plugin-env-compatible";

export default defineConfig({
	envPrefix: "REACT_APP_",
	base: "/",
	plugins: [react(), envCompatible()],
	server: {
		host: true,
	},
});
