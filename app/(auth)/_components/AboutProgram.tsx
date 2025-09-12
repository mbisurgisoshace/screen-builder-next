"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AboutProgramProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutProgram({ isOpen, onClose }: AboutProgramProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-md flex items-center justify-center"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="bg-[#EEF0FA] rounded-xl shadow-lg max-w-xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-800">About the program</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 bg-white">
          <div className="mb-6">
            <img
              src="/Rectangle 2029.png"
              alt="Program overview"
              className="w-full h-30 object-cover rounded-lg"
            />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Program title example
          </h3>
          <div className="mb-6 space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </div>
          <div className="bg-[#EEF0FA] border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Program include</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">Lorem ipsum dolor sit amet</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">Duis aute irure dolor in reprehenderit</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">Cillum dolore eu fugiat nulla pariatur</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
