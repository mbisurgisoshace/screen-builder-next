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
          <h2 className="text-xl font-bold text-gray-800">ABOUT THIS COURSE</h2>
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
              src="https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/NSF_ICORPS_Logo_Lockup_RGB-TIP%20(1)%20(1).png"
              alt="Program overview"
              className="w-full h-30 object-cover rounded-lg"
            />
          </div>
          {/* <h3 className="text-lg font-bold text-gray-800 mb-4">
            ABOUT THIS COURSE
          </h3> */}
          <div className="mb-6 space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Nebraska I-Corps: Introduction to Customer Discovery (ICD) is based on the National Science Foundation (NSF) Innovation Corps™ (I-Corps) curriculum, offering a methodology to help teams discover the commercial potential of their technology or innovation. During this non-credit course, you will learn how to talk to customers/stakeholders and gain insight from experienced leaders. The ICD course captures the foundation of I-Corps™ so that eligible university deep tech teams may be better equipped to go on to the NSF I-Corps™ national program.  
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              This program is <u>not</u> focused on how to write a research paper, business plan or NSF grant; rather the entire team will be engaged by getting out of the lab/building and discovering the value of their technology/innovation. Along the way, the ICD instructors will be guiding the teams through the course concepts, but the bulk of the work must come from teams engaging with real stakeholders.
            </p>
          </div>
          <div className="bg-[#EEF0FA] border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">SUMMARY OF COURSE REQUIREMENTS</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">Attend and actively participate in all four (4) main sessions</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">Attend at least three (3) office hour sessions with an instructor (at least one between each main session)</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">Conduct a minimum of 25 customer discovery interviews during the course and record findings in the app provided.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
