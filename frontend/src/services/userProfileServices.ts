import { getApi } from "../axios/axiosInstance";
const api = getApi("user");
import { showErrorToast } from "../utils/errorHandler";
import { USER_PROFILE_API } from "../constants/apiRoutes";

// Get user profile
export const getUserProfileAPI = async (token: string) => {
  return api.get(USER_PROFILE_API.GET);
};

// Update user profile
export const updateUserProfileAPI = async (
  token: string,
  data: any,
  image: File | null
) => {
  try {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("phone", data.phone);
    formData.append("gender", data.gender);
    formData.append("dob", data.dob);
    formData.append("address[line1]", data.address.line1);
    formData.append("address[line2]", data.address.line2);
    if (image) formData.append("image", image);

    const res = await api.put(USER_PROFILE_API.UPDATE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    showErrorToast(error);
  }
};

// Change user password
export const changeUserPasswordAPI = async (token: string, currentPassword: string, newPassword: string) => {
  try {
    const res = await api.put('/api/user/password/change', { currentPassword, newPassword });
    return res.data;
  } catch (error) {
    showErrorToast(error);
    throw error;
  }
};
