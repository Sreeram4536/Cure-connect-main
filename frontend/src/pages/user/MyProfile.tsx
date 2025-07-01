import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/user/assets";
import { toast } from "react-toastify";
import { updateUserProfileAPI } from "../../services/userProfileServices";
import { useNavigate } from "react-router-dom";
import { isValidDateOfBirth, isValidName, isValidPhone } from "../../utils/validator";
import { showErrorToast } from "../../utils/errorHandler";
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, Camera, X } from "lucide-react";

const MyProfile = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("TopDoctors must be used within an AppContextProvider");
  }

  const { userData, setUserData, token, loadUserProfileData } = context;

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    dob?: string;
  }>({});

  if (!userData) return null;

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        if (!isValidName(value)) {
          setErrors(prev => ({ ...prev, name: "Please enter a valid name" }));
          return false;
        } else {
          setErrors(prev => ({ ...prev, name: undefined }));
          return true;
        }
      case 'phone':
        if (!isValidPhone(value)) {
          setErrors(prev => ({ ...prev, phone: "Phone number must be exactly 10 digits" }));
          return false;
        } else {
          setErrors(prev => ({ ...prev, phone: undefined }));
          return true;
        }
      case 'dob':
        if (!isValidDateOfBirth(value)) {
          setErrors(prev => ({ ...prev, dob: "Please enter a valid birth date" }));
          return false;
        } else {
          setErrors(prev => ({ ...prev, dob: undefined }));
          return true;
        }
      default:
        return true;
    }
  };

  const updateUserProfileData = async () => {
    try {
      if (!token) {
        toast.error("Please login to continue...");
        return;
      }

      // Validate all fields
      const isNameValid = validateField('name', userData.name);
      const isPhoneValid = validateField('phone', userData.phone);
      const isDobValid = validateField('dob', userData.dob);

      if (!isNameValid || !isPhoneValid || !isDobValid) {
        return;
      }

      const data = await updateUserProfileAPI(
        token,
        {
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          gender: userData.gender,
          dob: userData.dob,
        },
        image
      );

      toast.success(data.message);
      await loadUserProfileData();
      setIsEdit(false);
      setImage(null);
      setErrors({});
    } catch (error) {
      showErrorToast(error);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    userData && (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
            {/* Profile Image Section */}
            <div className="text-center mb-8">
              {isEdit ? (
                <label htmlFor="image" className="inline-block relative cursor-pointer group">
                  <div className="relative">
                    <img
                      className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 group-hover:border-primary transition-all duration-300 shadow-lg"
                      src={image ? URL.createObjectURL(image) : userData.image}
                      alt="Profile"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    type="file"
                    id="image"
                    accept="image/*"
                    hidden
                  />
                </label>
              ) : (
                <div className="relative">
                  <img 
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 shadow-lg" 
                    src={userData.image} 
                    alt="Profile" 
                  />
                </div>
              )}
            </div>

            {/* Name Section */}
            <div className="mb-8">
              {isEdit ? (
                <div className="relative">
                  <input
                    className="w-full bg-white/70 border-2 border-gray-200 text-3xl font-semibold text-gray-800 px-4 py-3 rounded-xl focus:border-primary focus:outline-none transition-all duration-300"
                    type="text"
                    value={userData.name}
                    onChange={(e) => {
                      setUserData((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev
                      );
                      validateField('name', e.target.value);
                    }}
                    placeholder="Enter your name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>
              ) : (
                <h2 className="text-3xl font-bold text-gray-800 text-center">
                  {userData.name}
                </h2>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-primary" />
                  Contact Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                    <div className="flex items-center bg-white/70 rounded-lg px-4 py-3 border border-gray-200">
                      <Mail className="w-4 h-4 text-gray-500 mr-3" />
                      <span className="text-gray-800">{userData.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Phone</label>
                    {isEdit ? (
                      <div className="relative">
                        <div className="flex items-center bg-white/70 rounded-lg px-4 py-3 border-2 border-gray-200 focus-within:border-primary transition-all duration-300">
                          <Phone className="w-4 h-4 text-gray-500 mr-3" />
                          <input
                            className="bg-transparent text-gray-800 flex-1 focus:outline-none"
                            type="text"
                            value={userData.phone}
                            onChange={(e) => {
                              setUserData((prev) =>
                                prev ? { ...prev, phone: e.target.value } : prev
                              );
                              validateField('phone', e.target.value);
                            }}
                            placeholder="Enter phone number"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <X className="w-4 h-4 mr-1" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center bg-white/70 rounded-lg px-4 py-3 border border-gray-200">
                        <Phone className="w-4 h-4 text-gray-500 mr-3" />
                        <span className="text-gray-800">{userData.phone}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Address</label>
                    {isEdit ? (
                      <div className="space-y-2">
                        <div className="flex items-center bg-white/70 rounded-lg px-4 py-3 border-2 border-gray-200 focus-within:border-primary transition-all duration-300">
                          <MapPin className="w-4 h-4 text-gray-500 mr-3" />
                          <input
                            className="bg-transparent text-gray-800 flex-1 focus:outline-none"
                            value={userData.address.line1}
                            onChange={(e) =>
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      address: { ...prev.address, line1: e.target.value },
                                    }
                                  : prev
                              )
                            }
                            placeholder="Address line 1"
                          />
                        </div>
                        <div className="flex items-center bg-white/70 rounded-lg px-4 py-3 border-2 border-gray-200 focus-within:border-primary transition-all duration-300">
                          <MapPin className="w-4 h-4 text-gray-500 mr-3" />
                          <input
                            className="bg-transparent text-gray-800 flex-1 focus:outline-none"
                            value={userData.address.line2}
                            onChange={(e) =>
                              setUserData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      address: { ...prev.address, line2: e.target.value },
                                    }
                                  : prev
                              )
                            }
                            placeholder="Address line 2"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start bg-white/70 rounded-lg px-4 py-3 border border-gray-200">
                        <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-1" />
                        <div className="text-gray-800">
                          <div>{userData.address.line1}</div>
                          <div>{userData.address.line2}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary" />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Gender</label>
                    {isEdit ? (
                      <select
                        className="w-full bg-white/70 border-2 border-gray-200 text-gray-800 px-4 py-3 rounded-lg focus:border-primary focus:outline-none transition-all duration-300"
                        value={userData.gender}
                        onChange={(e) =>
                          setUserData((prev) =>
                            prev ? { ...prev, gender: e.target.value } : prev
                          )
                        }
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : (
                      <div className="bg-white/70 rounded-lg px-4 py-3 border border-gray-200">
                        <span className="text-gray-800">{userData.gender}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Date of Birth</label>
                    {isEdit ? (
                      <div className="relative">
                        <div className="flex items-center bg-white/70 rounded-lg px-4 py-3 border-2 border-gray-200 focus-within:border-primary transition-all duration-300">
                          <Calendar className="w-4 h-4 text-gray-500 mr-3" />
                          <input
                            className="bg-transparent text-gray-800 flex-1 focus:outline-none"
                            onChange={(e) => {
                              setUserData((prev) =>
                                prev ? { ...prev, dob: e.target.value } : prev
                              );
                              validateField('dob', e.target.value);
                            }}
                            type="date"
                            value={userData.dob}
                          />
                        </div>
                        {errors.dob && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <X className="w-4 h-4 mr-1" />
                            {errors.dob}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center bg-white/70 rounded-lg px-4 py-3 border border-gray-200">
                        <Calendar className="w-4 h-4 text-gray-500 mr-3" />
                        <span className="text-gray-800">{userData.dob}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 text-center">
              {isEdit ? (
                <div className="flex gap-4 justify-center">
                  <button
                    className="bg-gradient-to-r from-primary to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                    onClick={updateUserProfileData}
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </button>
                  <button
                    className="bg-gray-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 flex items-center"
                    onClick={() => {
                      setIsEdit(false);
                      setImage(null);
                      setErrors({});
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="bg-gradient-to-r from-primary to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center mx-auto"
                  onClick={() => setIsEdit(true)}
                >
                  <Edit3 className="w-5 h-5 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default MyProfile;
