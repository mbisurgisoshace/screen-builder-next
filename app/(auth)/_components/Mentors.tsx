"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Mentor {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
}

interface MentorsProps {
  isOpen: boolean;
  onClose: () => void;
}

const mentors: Mentor[] = [
  {
    id: "1",
    name: "Andrew Zimbroff",
    title: "Associate Professor and Extension Specialist-Textiles and Apparel Entrepreneurship",
    description: "https://cehs.unl.edu/tmfd/person/andrew-zimbroff/",
    image: "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/andrew-zimbroff.png"
  },
  {
    id: "2", 
    name: "Josh Nichol-Caddy",
    title: "Technology Commercialization Director, NBDC",
    description: "https://www.unomaha.edu/nebraska-business-development-center/about/consultant-directory/josh-nichol-caddy.php",
    image: "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/josh-nichol-caddy.png"
  },
  {
    id: "3",
    name: "Joy Eakin", 
    title: "Entrepreneurship Program Manager, NUtech Ventures",
    description: "https://www.nutechventures.org/joy-eakin/",
    image: "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/joy-eakin.png"
  },
  {
    id: "4",
    name: "Nick Alder", 
    title: "Entrepreneurship Catalyst, NUtech Ventures",
    description: "https://www.nutechventures.org/nicholas-alder/",
    image: "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/images/nick-alder.png"
  }
];

export default function Mentors({ isOpen, onClose }: MentorsProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-md flex items-center justify-center"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="bg-[#EEF0FA] rounded-xl shadow-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-800">Lead Instructors</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-[#EEF0FA] border border-gray-300 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={mentor.image}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
                  {mentor.name}
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  {mentor.title}
                </p>
                <p className="text-sm text-gray-700 line-clamp-5 leading-[1.2]">
                  {mentor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
