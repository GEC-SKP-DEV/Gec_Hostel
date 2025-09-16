import { useState } from "react";
import { CalendarDays, MapPin, Star, Phone, Mail, Globe, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Hostel } from "@/types/project";
import HostelImageSlider from './HostelImageSlider';

interface HostelCardProps {
  hostel: Hostel;
}

export default function HostelCard({ hostel }: HostelCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Helper to find category option by API category name
  const getCategoryOption = (categoryKey: string) => {
    // Map your display label keys to API keys if needed
    const apiKeyMap: Record<string, string> = {
      "Amenities": "Amenities",
      "Gender": "Gender",  // Room Type in API → Gender in UI
      "Distance": "Distance"  // Distance in API → Distance in UI
    };
    const apiKey = apiKeyMap[categoryKey] || categoryKey;
    return hostel.categories?.find(cat => cat.categoryName === apiKey)?.optionName;
  };

  const amenities = getCategoryOption("Amenities");
  const gender = getCategoryOption("Gender");
  const distance = getCategoryOption("Distance");

  // Get primary image or first image
  const primaryImage = hostel.images?.find(img => img.isPrimary) || hostel.images?.[0];

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform ${expanded ? "scale-105" : "hover:-translate-y-1"} w-full`}
      onClick={toggleExpand}
    >
      {/* Image Slider */}
      {hostel.images && hostel.images.length > 0 ? (
        <HostelImageSlider images={hostel.images} alt={hostel.hostelName} />
      ) : (
        <div className="w-full h-48 bg-gradient-to-r from-blue-200 to-blue-400 flex items-center justify-center text-3xl text-white font-bold">
          {hostel.hostelName.charAt(0)}
        </div>
      )}

      <div className="md:flex">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 md:w-1/3 relative">
          {primaryImage && (
            <div className="absolute inset-0 bg-cover bg-center opacity-20" 
                 style={{ backgroundImage: `url(${primaryImage.imageUrl})` }} />
          )}
          <div className="relative z-10">
            <h2 className="text-white text-xl font-semibold mb-2">{hostel.hostelName}</h2>
            {!expanded && <p className="text-gray-200 text-sm">{hostel.hostelDescription.slice(0, 100) + "..."}</p>}
            
            {/* Rating */}
            {hostel.averageRating && (
              <div className="flex items-center space-x-2 mt-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-semibold">{hostel.averageRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-200 text-sm">({hostel.totalRatings} reviews)</span>
              </div>
            )}

            {/* Price Range */}
            {/* {hostel.priceRange && (
              <div className="flex items-center space-x-2 mt-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">{hostel.priceRange}</span>
              </div>
            )} */}
          </div>
        </div>

        <div className="p-6 space-y-4 md:w-2/3 md:flex md:flex-col md:justify-between">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 group">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-gray-500 text-xs">Distance</p>
                <p className="text-gray-800 font-medium">{distance || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 group">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-gray-500 text-xs">Gender</p>
                <p className="text-gray-800 font-medium">{gender || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 group">
              <Star className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-gray-500 text-xs">Amenities</p>
                <p className="text-gray-800 font-medium">{amenities || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {hostel.phoneNumber && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 text-sm">{hostel.phoneNumber}</span>
                </div>
              )}
              {hostel.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 text-sm">{hostel.email}</span>
                </div>
              )}
              {hostel.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <Link href={hostel.website} target="_blank" rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-800 text-sm">
                    Visit Website
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-start">
            <Link
              href={hostel.location}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-all duration-300 hover:shadow-lg"
            >
              <ExternalLink className="w-4 h-4 group-hover:animate-bounce" />
              <span>View on Map</span>
            </Link>
          </div>

          {expanded && (
            <div className="space-y-4">
              <p className="text-gray-800 text-sm">{hostel.hostelDescription}</p>
              
              {/* Recent Comments */}
              {hostel.comments && hostel.comments.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Recent Reviews</h4>
                  <div className="space-y-2">
                    {hostel.comments.slice(0, 3).map((comment, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{comment.userName || 'Anonymous'}</span>
                          {comment.isVerified && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified</span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm">{comment.commentText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-between items-center">
            <button className="text-blue-600 hover:text-blue-800" onClick={toggleExpand}>
              {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </button>
            <Link
              href={hostel.hostelId ? `/hostels/${hostel.hostelId}` : '#'}
              className={`ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all duration-300${!hostel.hostelId ? ' opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              onClick={e => { if (!hostel.hostelId) e.preventDefault(); e.stopPropagation(); }}
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
