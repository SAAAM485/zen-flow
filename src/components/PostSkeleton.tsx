const PostSkeleton = () => {
    return (
        <div className="bg-secondary-bg shadow-md rounded-lg p-4 sm:p-6 mb-6 animate-pulse">
            <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 mr-4"></div>
                <div>
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-32"></div>
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-4/5"></div>
            </div>
            <div className="mt-4 h-40 bg-gray-700 rounded-lg"></div>
        </div>
    );
};

export default PostSkeleton;
