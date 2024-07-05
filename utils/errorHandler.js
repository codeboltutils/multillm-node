const handleError = (error) => {
    if (error.response) {
        // Server responded with a status other than 2xx
        console.error("Error response from server:", error.response.data);
        return {
            success: false,
            message: "Error response from server",
            data: error.response.data,
            status: error.response.status,
        };
    } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
        return {
            success: false,
            message: "No response received from server",
            data: error.request,
        };
    } else {
        // Something else happened while setting up the request
        console.error("Error setting up request:", error.message);
        return {
            success: false,
            message: "Error setting up request",
            error: error.message,
        };
    }
}

module.exports = {
    handleError
}