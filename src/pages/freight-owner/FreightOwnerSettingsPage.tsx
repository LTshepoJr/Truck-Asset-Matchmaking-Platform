import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";

import "../../styles/freight-owner-css/FreightOwnerSettingsPage.css";

import { ROUTES } from "../../routes/paths";
import {
  getCurrentSession,
  getRegisteredUserAccount,
  updateRegisteredUserAccount,
} from "../../services/authService";
import { getUserById } from "../../services/mockDb";

interface ProfileFormState {
  fullName: string;
  organizationName: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null;
}

interface ProfileFormErrors {
  fullName?: string;
  organizationName?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  general?: string;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_SIZE = 512;

function getVerificationLabel(status: string): string {
  switch (status) {
    case "verified":
      return "Verified";

    case "rejected":
      return "Verification rejected";

    case "pending":
    default:
      return "Awaiting admin review";
  }
}

function getComplianceLabel(status: string): string {
  switch (status) {
    case "approved":
      return "Approved";

    case "review":
      return "Under compliance review";

    case "rejected":
      return "Compliance rejected";

    case "pending":
    default:
      return "Awaiting compliance review";
  }
}

function formatAccountDate(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "long",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function loadBrowserImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("The selected image could not be opened."));
    image.src = source;
  });
}

async function compressProfileImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadBrowserImage(objectUrl);

    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error("The selected image does not have valid dimensions.");
    }

    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);

    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = PROFILE_IMAGE_SIZE;
    canvas.height = PROFILE_IMAGE_SIZE;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Your browser could not prepare the profile image.");
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      PROFILE_IMAGE_SIZE,
      PROFILE_IMAGE_SIZE,
    );

    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function validateProfile(form: ProfileFormState): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (form.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name using at least two characters.";
  } else if (form.fullName.trim().length > 100) {
    errors.fullName = "Your full name cannot exceed 100 characters.";
  }

  if (form.organizationName.trim().length < 2) {
    errors.organizationName =
      "Enter your organization name using at least two characters.";
  } else if (form.organizationName.trim().length > 120) {
    errors.organizationName =
      "The organization name cannot exceed 120 characters.";
  }

  const email = form.email.trim();

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const phoneNumber = form.phoneNumber.trim();

  if (!phoneNumber) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!/^[+0-9() -]{7,30}$/.test(phoneNumber)) {
    errors.phoneNumber =
      "Enter a valid phone number using digits, spaces, brackets, hyphens or a leading plus.";
  }

  return errors;
}

function hasProfileChanges(
  form: ProfileFormState,
  saved: ProfileFormState,
): boolean {
  return (
    form.fullName.trim() !== saved.fullName ||
    form.organizationName.trim() !== saved.organizationName ||
    form.email.trim().toLowerCase() !== saved.email ||
    form.phoneNumber.trim() !== saved.phoneNumber ||
    form.profileImage !== saved.profileImage
  );
}

export function FreightOwnerSettingsPage() {
  const session = getCurrentSession();

  const profile = session ? getUserById(session.id) : undefined;

  const registeredAccount = session
    ? getRegisteredUserAccount(session.id)
    : null;

  const initialForm: ProfileFormState = {
    fullName: profile?.name ?? registeredAccount?.fullName ?? "",
    organizationName:
      profile?.company ?? registeredAccount?.organizationName ?? "",
    email: profile?.email ?? registeredAccount?.email ?? session?.email ?? "",
    phoneNumber: profile?.phoneNumber ?? registeredAccount?.phoneNumber ?? "",
    profileImage: profile?.profileImage ?? null,
  };

  const [form, setForm] = useState<ProfileFormState>(initialForm);

  const [savedForm, setSavedForm] = useState<ProfileFormState>({
    ...initialForm,
    fullName: initialForm.fullName.trim(),
    organizationName: initialForm.organizationName.trim(),
    email: initialForm.email.trim().toLowerCase(),
    phoneNumber: initialForm.phoneNumber.trim(),
  });

  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = hasProfileChanges(form, savedForm);

  const clearFieldError = (field: keyof ProfileFormErrors) => {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      general: undefined,
    }));
  };

  const updateField = (
    field: "fullName" | "organizationName" | "email" | "phoneNumber",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setNotice("");
    clearFieldError(field);
  };

  const handleImageSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setNotice("");
    clearFieldError("profileImage");

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setErrors((current) => ({
        ...current,
        profileImage: "Choose a JPG, PNG or WEBP image.",
      }));
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((current) => ({
        ...current,
        profileImage: "The original image cannot exceed 5 MB.",
      }));
      return;
    }

    setIsPreparingImage(true);

    try {
      const profileImage = await compressProfileImage(file);

      setForm((current) => ({
        ...current,
        profileImage,
      }));
    } catch (caughtError) {
      setErrors((current) => ({
        ...current,
        profileImage:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to prepare the selected image.",
      }));
    } finally {
      setIsPreparingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((current) => ({
      ...current,
      profileImage: null,
    }));

    setNotice("");
    clearFieldError("profileImage");
  };

  const handleReset = () => {
    setForm(savedForm);
    setErrors({});
    setNotice("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrors({});
    setNotice("");

    if (!session || session.role !== "freight-owner") {
      setErrors({
        general:
          "Your Freight Owner session could not be found. Sign in again.",
      });
      return;
    }

    const validationErrors = validateProfile(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);

    try {
      const updatedProfile = updateRegisteredUserAccount({
        userId: session.id,
        fullName: form.fullName,
        organizationName: form.organizationName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        profileImage: form.profileImage,
      });

      const nextSavedForm: ProfileFormState = {
        fullName: updatedProfile.name,
        organizationName: updatedProfile.company,
        email: updatedProfile.email,
        phoneNumber: updatedProfile.phoneNumber ?? form.phoneNumber.trim(),
        profileImage: updatedProfile.profileImage ?? null,
      };

      setForm(nextSavedForm);
      setSavedForm(nextSavedForm);

      setNotice(
        "Your profile settings were saved. The updated details now appear across your Freight Owner workspace.",
      );
    } catch (caughtError) {
      setErrors({
        general:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to save your profile settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!session || session.role !== "freight-owner" || !profile) {
    return (
      <section className="freight-settings-page">
        <div className="freight-settings-page__alert" role="alert">
          Your Freight Owner profile could not be loaded. Please sign in again.
        </div>
      </section>
    );
  }

  return (
    <section className="freight-settings-page">
      <header className="freight-settings-page__header">
        <div>
          <p className="freight-settings-page__eyebrow">Account preferences</p>

          <h2>Settings</h2>

          <p>
            Update the identity and contact details displayed throughout your
            Freight Owner workspace.
          </p>
        </div>

        <Link
          className="freight-settings-page__back-link"
          to={ROUTES.freightOwner}
        >
          Back to dashboard
        </Link>
      </header>

      {errors.general && (
        <div className="freight-settings-page__alert" role="alert">
          {errors.general}
        </div>
      )}

      {notice && (
        <div
          className="freight-settings-page__alert freight-settings-page__alert--success"
          role="status"
        >
          {notice}
        </div>
      )}

      <form
        className="freight-settings-page__layout"
        onSubmit={handleSubmit}
        noValidate
      >
        <aside className="freight-settings-page__sidebar">
          <section className="freight-settings-page__profile-card">
            <div className="freight-settings-page__profile-preview">
              {form.profileImage ? (
                <img
                  src={form.profileImage}
                  alt={`${form.fullName || "User"} profile`}
                />
              ) : (
                <span aria-hidden="true">{getInitial(form.fullName)}</span>
              )}
            </div>

            <h3>{form.fullName.trim() || "Your profile"}</h3>

            <p>
              {form.organizationName.trim() || "Freight Owner organization"}
            </p>

            <input
              ref={fileInputRef}
              className="freight-settings-page__file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelection}
            />

            <button
              type="button"
              className="freight-settings-page__upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPreparingImage}
            >
              {isPreparingImage
                ? "Preparing image..."
                : form.profileImage
                  ? "Replace picture"
                  : "Add profile picture"}
            </button>

            {form.profileImage && (
              <button
                type="button"
                className="freight-settings-page__remove-button"
                onClick={handleRemoveImage}
                disabled={isPreparingImage}
              >
                Remove picture
              </button>
            )}

            <small>
              JPG, PNG or WEBP. The image is cropped square and compressed
              before it is stored in this frontend MVP.
            </small>

            {errors.profileImage && (
              <p className="freight-settings-page__field-error" role="alert">
                {errors.profileImage}
              </p>
            )}
          </section>

          <section className="freight-settings-page__account-card">
            <div>
              <span>Workspace role</span>
              <strong>Freight Owner</strong>
            </div>

            <div>
              <span>Verification</span>
              <strong>
                {getVerificationLabel(profile.verificationStatus)}
              </strong>
            </div>

            <div>
              <span>Compliance</span>
              <strong>{getComplianceLabel(profile.complianceStatus)}</strong>
            </div>

            <div>
              <span>Account created</span>
              <strong>{formatAccountDate(profile.createdAt)}</strong>
            </div>
          </section>
        </aside>

        <div className="freight-settings-page__main">
          <section className="freight-settings-page__panel">
            <div className="freight-settings-page__panel-heading">
              <div>
                <h3>Profile information</h3>

                <p>
                  These details are used on your dashboard, receipts and account
                  shell.
                </p>
              </div>

              <span>Editable</span>
            </div>

            <div className="freight-settings-page__form-grid">
              <div className="freight-settings-page__field">
                <label htmlFor="settings-full-name">Full name</label>

                <input
                  id="settings-full-name"
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  maxLength={100}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                />

                {errors.fullName && (
                  <p
                    className="freight-settings-page__field-error"
                    role="alert"
                  >
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="freight-settings-page__field">
                <label htmlFor="settings-organization">Organization name</label>

                <input
                  id="settings-organization"
                  type="text"
                  value={form.organizationName}
                  onChange={(event) =>
                    updateField("organizationName", event.target.value)
                  }
                  maxLength={120}
                  autoComplete="organization"
                  aria-invalid={Boolean(errors.organizationName)}
                />

                {errors.organizationName && (
                  <p
                    className="freight-settings-page__field-error"
                    role="alert"
                  >
                    {errors.organizationName}
                  </p>
                )}
              </div>

              <div className="freight-settings-page__field">
                <label htmlFor="settings-email">Email address</label>

                <input
                  id="settings-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />

                <small>
                  This becomes the email used for your next sign-in.
                </small>

                {errors.email && (
                  <p
                    className="freight-settings-page__field-error"
                    role="alert"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="freight-settings-page__field">
                <label htmlFor="settings-phone">Phone number</label>

                <input
                  id="settings-phone"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(event) =>
                    updateField("phoneNumber", event.target.value)
                  }
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="+27 82 123 4567"
                  aria-invalid={Boolean(errors.phoneNumber)}
                />

                {errors.phoneNumber && (
                  <p
                    className="freight-settings-page__field-error"
                    role="alert"
                  >
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="freight-settings-page__panel">
            <div className="freight-settings-page__panel-heading">
              <div>
                <h3>Security</h3>

                <p>
                  Use the existing password recovery flow when you need to
                  replace your password.
                </p>
              </div>

              <span>Protected</span>
            </div>

            <div className="freight-settings-page__security-row">
              <div>
                <strong>Password</strong>

                <p>
                  Password values are never displayed inside account settings.
                </p>
              </div>

              <Link to={ROUTES.forgotPassword}>Reset password</Link>
            </div>
          </section>

          <div className="freight-settings-page__actions">
            <button
              type="button"
              className="freight-settings-page__reset-button"
              onClick={handleReset}
              disabled={!isDirty || isSaving || isPreparingImage}
            >
              Discard changes
            </button>

            <button
              type="submit"
              disabled={!isDirty || isSaving || isPreparingImage}
            >
              {isSaving ? "Saving settings..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
