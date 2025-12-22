import { motion } from 'framer-motion';

export const StartingView = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full justify-center items-center gap-4"
        >
            <div className="relative">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">
                Connecting to Confluent Cloud...
            </p>
        </motion.div>
    );
};
