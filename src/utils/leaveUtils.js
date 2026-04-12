export const calculateLeaveDays = (startDate, endDate) => {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid dates provided');
        }
        if (end < start) {
            throw new Error('End date cannot be before start date');
        }

        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    } catch (err) {
        console.error('Error calculating leave days:', err.message);
        return 0;
    }
};