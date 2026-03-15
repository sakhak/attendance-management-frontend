import React from "react";
import { ThreeDots } from "react-loader-spinner";

const Loading: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 bg-white/70 flex items-center justify-center">
            <ThreeDots height="80" width="80" color="#3b82f6" />
        </div>
    );
};

export default Loading;
