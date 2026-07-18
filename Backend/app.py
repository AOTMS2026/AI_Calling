import uvicorn

if __name__ == "__main__":
    # Runs the uvicorn development server programmatically
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
