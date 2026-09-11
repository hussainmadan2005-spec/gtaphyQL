package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

const port = "1234"

func main() {
	// Get the current directory
	dir, err := os.Getwd()
	if err != nil {
		log.Fatal("Error getting current directory:", err)
	}

	// Create a file server handler for the current directory
	fs := http.FileServer(http.Dir(dir))

	// Add custom handler to serve index.html for root path
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If requesting root, serve index.html
		if r.URL.Path == "/" {
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
			return
		}
		// Otherwise, use the file server
		fs.ServeHTTP(w, r)
	})

	// Set proper MIME types for JavaScript modules
	http.HandleFunc("/app.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.ServeFile(w, r, filepath.Join(dir, "app.js"))
	})

	http.HandleFunc("/utils.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.ServeFile(w, r, filepath.Join(dir, "utils.js"))
	})

	http.HandleFunc("/svg.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.ServeFile(w, r, filepath.Join(dir, "svg.js"))
	})

	http.HandleFunc("/auth.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.ServeFile(w, r, filepath.Join(dir, "auth.js"))
	})

	http.HandleFunc("/api.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.ServeFile(w, r, filepath.Join(dir, "api.js"))
	})

	http.HandleFunc("/queries.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.ServeFile(w, r, filepath.Join(dir, "queries.js"))
	})

	// Serve CSS files
	http.HandleFunc("/style.css", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/css")
		http.ServeFile(w, r, filepath.Join(dir, "style.css"))
	})

	// Start server
	fmt.Printf("🚀 Server starting on http://localhost:%s\n", port)
	fmt.Printf("📂 Serving files from: %s\n", dir)
	fmt.Printf("🌐 Open your browser to: http://localhost:%s\n\n", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
