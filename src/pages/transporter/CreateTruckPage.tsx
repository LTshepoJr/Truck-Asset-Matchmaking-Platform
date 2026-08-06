import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../../styles/transporter-css/CreateTruckPage.css";
import { getCurrentSession } from "../../services/authService";
import { getDb, getTruckById } from "../../services/mockDb";
import {
  createTransporterTruck,
  updateTransporterTruck,
} from "../../services/transporterTruckService";
import { ROUTES } from "../../routes/paths";
import type {
  CreateTruckInput,
  LookupLocation,
  VehicleTypeId,
} from "../../types/tamp";

type TruckFormState = {
  displayName: string;
  registrationDisplay: string;
  vehicleType: VehicleTypeId;
  capacityTonnes: string;
  capacityM3: string;
  locationCity: string;
  availabilityStart: string;
  availabilityEnd: string;
};

type TruckFormErrors = Partial<Record<keyof TruckFormState, string>>;

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offsetMilliseconds = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMilliseconds)
    .toISOString()
    .slice(0, 16);
}

function defaultDateTimeLocal(hoursFromNow: number) {
  return toDateTimeLocal(
    new Date(Date.now() + hoursFromNow * 60 * 60 * 1_000).toISOString(),
  );
}

function buildInitialState(
  existingTruck: ReturnType<typeof getTruckById>,
  defaultLocation: LookupLocation | undefined,
): TruckFormState {
  if (existingTruck) {
    return {
      displayName: existingTruck.displayName,
      registrationDisplay: existingTruck.registrationDisplay,
      vehicleType: existingTruck.vehicleType,
      capacityTonnes: String(existingTruck.capacityKg / 1_000),
      capacityM3: String(existingTruck.capacityM3),
      locationCity: existingTruck.currentLocation.city,
      availabilityStart: toDateTimeLocal(
        existingTruck.availabilityWindow.start,
      ),
      availabilityEnd: toDateTimeLocal(existingTruck.availabilityWindow.end),
    };
  }

  return {
    displayName: "",
    registrationDisplay: "",
    vehicleType: "tautliner",
    capacityTonnes: "",
    capacityM3: "",
    locationCity: defaultLocation?.city ?? "",
    availabilityStart: defaultDateTimeLocal(1),
    availabilityEnd: defaultDateTimeLocal(25),
  };
}

function validateForm(form: TruckFormState): TruckFormErrors {
  const errors: TruckFormErrors = {};
  const capacityTonnes = Number(form.capacityTonnes);
  const capacityM3 = Number(form.capacityM3);
  const availabilityStart = new Date(form.availabilityStart).getTime();
  const availabilityEnd = new Date(form.availabilityEnd).getTime();

  if (!form.displayName.trim()) errors.displayName = "Enter a truck name.";
  if (!form.registrationDisplay.trim()) {
    errors.registrationDisplay = "Enter a registration number.";
  }
  if (!Number.isFinite(capacityTonnes) || capacityTonnes <= 0) {
    errors.capacityTonnes = "Capacity must be greater than zero.";
  }
  if (!Number.isFinite(capacityM3) || capacityM3 <= 0) {
    errors.capacityM3 = "Volume capacity must be greater than zero.";
  }
  if (!form.locationCity) errors.locationCity = "Select the current location.";
  if (!Number.isFinite(availabilityStart)) {
    errors.availabilityStart = "Select a valid start time.";
  }
  if (!Number.isFinite(availabilityEnd)) {
    errors.availabilityEnd = "Select a valid end time.";
  } else if (availabilityStart >= availabilityEnd) {
    errors.availabilityEnd = "End time must be after the start time.";
  }

  return errors;
}

export function CreateTruckPage() {
  const session = getCurrentSession();
  const navigate = useNavigate();
  const { truckId } = useParams<{ truckId?: string }>();
  const db = getDb();
  const locations = [...db.lookups.locations].sort((left, right) =>
    left.city.localeCompare(right.city),
  );
  const vehicleTypes = db.lookups.vehicleTypes;
  const existingTruck = truckId ? getTruckById(truckId) : undefined;
  const isEditing = Boolean(truckId);
  const [form, setForm] = useState<TruckFormState>(() =>
    buildInitialState(existingTruck, locations[0]),
  );
  const [errors, setErrors] = useState<TruckFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session || session.role !== "transporter") {
    return (
      <section className="create-truck create-truck--state">
        <div className="create-truck__state-card" role="alert">
          <p className="create-truck__eyebrow">Fleet management</p>
          <h1>Transporter session required</h1>
          <p>Sign in with a Transporter account to post a truck.</p>
        </div>
      </section>
    );
  }

  if (
    isEditing &&
    (!existingTruck || existingTruck.transporterId !== session.id)
  ) {
    return (
      <section className="create-truck create-truck--state">
        <div className="create-truck__state-card" role="alert">
          <p className="create-truck__eyebrow">Fleet management</p>
          <h1>Truck not found</h1>
          <p>This truck does not exist or does not belong to your account.</p>
          <Link to={ROUTES.transporterTrucks}>Return to my trucks</Link>
        </div>
      </section>
    );
  }

  const selectedVehicleType = vehicleTypes.find(
    (vehicleType) => vehicleType.id === form.vehicleType,
  );

  const updateField = <Key extends keyof TruckFormState>(
    field: Key,
    value: TruckFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitError("Check the highlighted fields and try again.");
      return;
    }

    const location = locations.find((item) => item.city === form.locationCity);
    if (!location) {
      setErrors((current) => ({
        ...current,
        locationCity: "Select a valid current location.",
      }));
      return;
    }

    const input: CreateTruckInput = {
      displayName: form.displayName.trim(),
      registrationDisplay: form.registrationDisplay.trim(),
      vehicleType: form.vehicleType,
      capacityKg: Number(form.capacityTonnes) * 1_000,
      capacityM3: Number(form.capacityM3),
      currentLocation: {
        city: location.city,
        province: location.province,
        lat: location.lat,
        lng: location.lng,
      },
      availabilityWindow: {
        start: new Date(form.availabilityStart).toISOString(),
        end: new Date(form.availabilityEnd).toISOString(),
      },
    };

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing && truckId) {
        updateTransporterTruck(session.id, truckId, input);
      } else {
        createTransporterTruck(session.id, input);
      }

      navigate(ROUTES.transporterTrucks, {
        replace: true,
        state: {
          message: isEditing
            ? "Truck details updated successfully."
            : "Truck added successfully and is available for matching.",
        },
      });
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save this truck.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-truck" aria-labelledby="create-truck-heading">
      <header className="create-truck__header">
        <div>
          <p className="create-truck__eyebrow">Fleet management</p>
          <h1 id="create-truck-heading">
            {isEditing ? "Edit truck" : "Add a truck"}
          </h1>
          <p>
            Capture the vehicle, capacity, current location and availability
            window used by the matching rules.
          </p>
        </div>
        <Link to={ROUTES.transporterTrucks}>Back to my trucks</Link>
      </header>

      <form className="create-truck__form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <div className="create-truck__submit-error" role="alert">
            {submitError}
          </div>
        ) : null}

        <fieldset>
          <legend>Vehicle details</legend>
          <div className="create-truck__grid">
            <label>
              <span>Truck name</span>
              <input
                type="text"
                value={form.displayName}
                onChange={(event) =>
                  updateField("displayName", event.target.value)
                }
                placeholder="Example: Tautliner 34T"
                aria-invalid={Boolean(errors.displayName)}
                aria-describedby={
                  errors.displayName ? "display-name-error" : undefined
                }
              />
              {errors.displayName ? (
                <small id="display-name-error">{errors.displayName}</small>
              ) : null}
            </label>

            <label>
              <span>Registration number</span>
              <input
                type="text"
                value={form.registrationDisplay}
                onChange={(event) =>
                  updateField("registrationDisplay", event.target.value)
                }
                placeholder="Example: GP 123-456"
                autoCapitalize="characters"
                aria-invalid={Boolean(errors.registrationDisplay)}
                aria-describedby={
                  errors.registrationDisplay ? "registration-error" : undefined
                }
              />
              {errors.registrationDisplay ? (
                <small id="registration-error">
                  {errors.registrationDisplay}
                </small>
              ) : null}
            </label>

            <label>
              <span>Vehicle type</span>
              <select
                value={form.vehicleType}
                onChange={(event) =>
                  updateField(
                    "vehicleType",
                    event.target.value as VehicleTypeId,
                  )
                }
              >
                {vehicleTypes.map((vehicleType) => (
                  <option key={vehicleType.id} value={vehicleType.id}>
                    {vehicleType.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="create-truck__cargo" aria-live="polite">
              <span>Compatible cargo</span>
              <div>
                {selectedVehicleType?.compatibleCargo.map((cargoType) => (
                  <small key={cargoType}>{cargoType}</small>
                ))}
              </div>
            </div>

            <label>
              <span>Capacity (tonnes)</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.capacityTonnes}
                onChange={(event) =>
                  updateField("capacityTonnes", event.target.value)
                }
                placeholder="34"
                aria-invalid={Boolean(errors.capacityTonnes)}
                aria-describedby={
                  errors.capacityTonnes ? "capacity-tonnes-error" : undefined
                }
              />
              {errors.capacityTonnes ? (
                <small id="capacity-tonnes-error">
                  {errors.capacityTonnes}
                </small>
              ) : null}
            </label>

            <label>
              <span>Volume capacity (m³)</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.capacityM3}
                onChange={(event) =>
                  updateField("capacityM3", event.target.value)
                }
                placeholder="90"
                aria-invalid={Boolean(errors.capacityM3)}
                aria-describedby={
                  errors.capacityM3 ? "capacity-volume-error" : undefined
                }
              />
              {errors.capacityM3 ? (
                <small id="capacity-volume-error">{errors.capacityM3}</small>
              ) : null}
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Location and availability</legend>
          <div className="create-truck__grid">
            <label className="create-truck__field--wide">
              <span>Current location</span>
              <select
                value={form.locationCity}
                onChange={(event) =>
                  updateField("locationCity", event.target.value)
                }
                aria-invalid={Boolean(errors.locationCity)}
                aria-describedby={
                  errors.locationCity ? "location-error" : undefined
                }
              >
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option
                    key={`${location.city}-${location.province}`}
                    value={location.city}
                  >
                    {location.city}, {location.province}
                  </option>
                ))}
              </select>
              {errors.locationCity ? (
                <small id="location-error">{errors.locationCity}</small>
              ) : null}
            </label>

            <label>
              <span>Available from</span>
              <input
                type="datetime-local"
                value={form.availabilityStart}
                onChange={(event) =>
                  updateField("availabilityStart", event.target.value)
                }
                aria-invalid={Boolean(errors.availabilityStart)}
                aria-describedby={
                  errors.availabilityStart
                    ? "availability-start-error"
                    : undefined
                }
              />
              {errors.availabilityStart ? (
                <small id="availability-start-error">
                  {errors.availabilityStart}
                </small>
              ) : null}
            </label>

            <label>
              <span>Available until</span>
              <input
                type="datetime-local"
                value={form.availabilityEnd}
                onChange={(event) =>
                  updateField("availabilityEnd", event.target.value)
                }
                aria-invalid={Boolean(errors.availabilityEnd)}
                aria-describedby={
                  errors.availabilityEnd ? "availability-end-error" : undefined
                }
              />
              {errors.availabilityEnd ? (
                <small id="availability-end-error">
                  {errors.availabilityEnd}
                </small>
              ) : null}
            </label>
          </div>
        </fieldset>

        <div className="create-truck__actions">
          <Link to={ROUTES.transporterTrucks}>Cancel</Link>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Add truck"}
          </button>
        </div>
      </form>
    </section>
  );
}
