import { useMemo, useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";

import "../../styles/CreateLoadPage.css";

import { ROUTES } from "../../routes/paths";
import { getCurrentSession } from "../../services/authService";
import {
  createLoad,
  getCargoTypes,
  getLookupLocations,
  getVehicleTypes,
} from "../../services/mockDb";

import type {
  CargoType,
  Load,
  Location,
  LookupLocation,
  VehicleTypeId,
} from "../../types/tamp";

interface LoadFormData {
  originCity: string;
  destinationCity: string;
  cargoType: CargoType | "";
  description: string;
  weightKg: string;
  volumeM3: string;
  requiredVehicleType: VehicleTypeId | "";
  pickupStart: string;
  pickupEnd: string;
}

interface LoadFormErrors {
  originCity?: string;
  destinationCity?: string;
  cargoType?: string;
  description?: string;
  weightKg?: string;
  volumeM3?: string;
  requiredVehicleType?: string;
  pickupStart?: string;
  pickupEnd?: string;
  general?: string;
}

const INITIAL_FORM_DATA: LoadFormData = {
  originCity: "",
  destinationCity: "",
  cargoType: "",
  description: "",
  weightKg: "",
  volumeM3: "",
  requiredVehicleType: "",
  pickupStart: "",
  pickupEnd: "",
};

function toLocation(location: LookupLocation): Location {
  return {
    city: location.city,
    province: location.province,
    lat: location.lat,
    lng: location.lng,
  };
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CreateLoadPage() {
  const locations = useMemo(() => getLookupLocations(), []);
  const cargoTypes = useMemo(() => getCargoTypes(), []);
  const vehicleTypes = useMemo(() => getVehicleTypes(), []);

  const [formData, setFormData] = useState<LoadFormData>(INITIAL_FORM_DATA);

  const [errors, setErrors] = useState<LoadFormErrors>({});
  const [createdLoad, setCreatedLoad] = useState<Load | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const compatibleVehicleTypes = useMemo(() => {
    if (!formData.cargoType) {
      return vehicleTypes;
    }

    return vehicleTypes.filter((vehicleType) =>
      vehicleType.compatibleCargo.includes(formData.cargoType as CargoType),
    );
  }, [formData.cargoType, vehicleTypes]);

  const clearError = (field: keyof LoadFormErrors) => {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      general: undefined,
    }));
  };

  const handleCargoTypeChange = (cargoType: CargoType | "") => {
    setFormData((current) => {
      const selectedVehicle = vehicleTypes.find(
        (vehicleType) => vehicleType.id === current.requiredVehicleType,
      );

      const vehicleStillCompatible =
        cargoType && selectedVehicle?.compatibleCargo.includes(cargoType);

      return {
        ...current,
        cargoType,
        requiredVehicleType: vehicleStillCompatible
          ? current.requiredVehicleType
          : "",
      };
    });

    clearError("cargoType");
    clearError("requiredVehicleType");
  };

  const validateForm = (): LoadFormErrors => {
    const newErrors: LoadFormErrors = {};

    if (!formData.originCity) {
      newErrors.originCity = "Select an origin.";
    }

    if (!formData.destinationCity) {
      newErrors.destinationCity = "Select a destination.";
    } else if (
      formData.originCity &&
      formData.originCity === formData.destinationCity
    ) {
      newErrors.destinationCity =
        "Destination must be different from the origin.";
    }

    if (!formData.cargoType) {
      newErrors.cargoType = "Select a cargo type.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Enter a cargo description.";
    }

    const weightKg = Number(formData.weightKg);

    if (!formData.weightKg.trim()) {
      newErrors.weightKg = "Enter the load weight.";
    } else if (!Number.isFinite(weightKg) || weightKg <= 0) {
      newErrors.weightKg = "Weight must be greater than zero.";
    }

    const volumeM3 = Number(formData.volumeM3);

    if (!formData.volumeM3.trim()) {
      newErrors.volumeM3 = "Enter the load volume.";
    } else if (!Number.isFinite(volumeM3) || volumeM3 <= 0) {
      newErrors.volumeM3 = "Volume must be greater than zero.";
    }

    if (!formData.requiredVehicleType) {
      newErrors.requiredVehicleType = "Select a required vehicle type.";
    }

    if (!formData.pickupStart) {
      newErrors.pickupStart = "Select the pickup window start.";
    }

    if (!formData.pickupEnd) {
      newErrors.pickupEnd = "Select the pickup window end.";
    }

    if (formData.pickupStart && formData.pickupEnd) {
      const pickupStart = new Date(formData.pickupStart).getTime();
      const pickupEnd = new Date(formData.pickupEnd).getTime();

      if (pickupEnd <= pickupStart) {
        newErrors.pickupEnd = "Pickup window end must be after the start time.";
      }
    }

    if (formData.cargoType && formData.requiredVehicleType) {
      const selectedVehicle = vehicleTypes.find(
        (vehicleType) => vehicleType.id === formData.requiredVehicleType,
      );

      if (
        selectedVehicle &&
        !selectedVehicle.compatibleCargo.includes(formData.cargoType)
      ) {
        newErrors.requiredVehicleType =
          "The selected vehicle type is not compatible with this cargo.";
      }
    }

    return newErrors;
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrors({});

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const session = getCurrentSession();

    if (!session || session.role !== "freight-owner") {
      setErrors({
        general:
          "Your Freight Owner session could not be found. Please sign in again.",
      });
      return;
    }

    const origin = locations.find(
      (location) => location.city === formData.originCity,
    );

    const destination = locations.find(
      (location) => location.city === formData.destinationCity,
    );

    if (!origin || !destination) {
      setErrors({
        general:
          "The selected route could not be resolved. Please select the route again.",
      });
      return;
    }

    if (!formData.cargoType || !formData.requiredVehicleType) {
      return;
    }

    setIsSubmitting(true);

    try {
      const load = createLoad(session.id, {
        origin: toLocation(origin),
        destination: toLocation(destination),
        cargoType: formData.cargoType,
        description: formData.description.trim(),
        weightKg: Number(formData.weightKg),
        volumeM3: Number(formData.volumeM3),
        requiredVehicleType: formData.requiredVehicleType,
        pickupWindow: {
          start: new Date(formData.pickupStart).toISOString(),
          end: new Date(formData.pickupEnd).toISOString(),
        },
      });

      setCreatedLoad(load);
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create this load. Please try again.";

      setErrors({
        general: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostAnother = () => {
    setCreatedLoad(null);
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  };

  const createdVehicleType = createdLoad
    ? vehicleTypes.find(
        (vehicleType) => vehicleType.id === createdLoad.requiredVehicleType,
      )
    : undefined;

  return (
    <section className="create-load-page" aria-labelledby="create-load-title">
      {createdLoad ? (
        <article className="create-load-page__success" aria-live="polite">
          <div className="create-load-page__success-heading">
            <span className="create-load-page__success-icon" aria-hidden="true">
              ✓
            </span>

            <div>
              <p className="create-load-page__eyebrow">Load created</p>

              <h3>{createdLoad.id}</h3>

              <p>Your load has been saved and is now open for matchmaking.</p>
            </div>
          </div>

          <dl className="create-load-page__summary">
            <div>
              <dt>Status</dt>
              <dd>
                <span className="create-load-page__status">
                  {createdLoad.status}
                </span>
              </dd>
            </div>

            <div>
              <dt>Route</dt>
              <dd>
                {createdLoad.origin.city} → {createdLoad.destination.city}
              </dd>
            </div>

            <div>
              <dt>Cargo</dt>
              <dd>{createdLoad.cargoType}</dd>
            </div>

            <div>
              <dt>Weight</dt>
              <dd>{createdLoad.weightKg.toLocaleString("en-ZA")} kg</dd>
            </div>

            <div>
              <dt>Volume</dt>
              <dd>{createdLoad.volumeM3} m³</dd>
            </div>

            <div>
              <dt>Required vehicle</dt>
              <dd>
                {createdVehicleType?.label ?? createdLoad.requiredVehicleType}
              </dd>
            </div>

            <div className="create-load-page__summary-wide">
              <dt>Pickup window</dt>
              <dd>
                {formatDateTime(createdLoad.pickupWindow.start)} –{" "}
                {formatDateTime(createdLoad.pickupWindow.end)}
              </dd>
            </div>
          </dl>

          <div className="create-load-page__actions">
            <Link
              className="create-load-page__secondary-action"
              to={ROUTES.freightOwnerLoads}
            >
              View my loads
            </Link>

            <button type="button" onClick={handlePostAnother}>
              Post another load
            </button>
          </div>
        </article>
      ) : (
        <>
          <header className="create-load-page__header">
            <h2 id="create-load-title">Post a new load</h2>

            <p>
              Enter the cargo, route and pickup requirements. TAMP will use
              these details when finding compatible available trucks.
            </p>
          </header>

          <form
            className="create-load-page__form"
            onSubmit={handleSubmit}
            noValidate
          >
            {errors.general && (
              <div className="create-load-page__alert" role="alert">
                {errors.general}
              </div>
            )}

            <fieldset className="create-load-page__section">
              <legend>Route</legend>

              <p className="create-load-page__section-description">
                Where should the cargo be collected and delivered?
              </p>

              <div className="create-load-page__grid">
                <div className="create-load-page__field">
                  <label htmlFor="load-origin">Origin</label>

                  <select
                    id="load-origin"
                    value={formData.originCity}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        originCity: event.target.value,
                      }));

                      clearError("originCity");
                    }}
                    aria-invalid={Boolean(errors.originCity)}
                    aria-describedby={
                      errors.originCity ? "load-origin-error" : undefined
                    }
                    required
                  >
                    <option value="">Select origin</option>

                    {locations.map((location) => (
                      <option
                        key={`${location.city}-${location.province}`}
                        value={location.city}
                      >
                        {location.city} — {location.province}
                      </option>
                    ))}
                  </select>

                  {errors.originCity && (
                    <p
                      id="load-origin-error"
                      className="create-load-page__error"
                    >
                      {errors.originCity}
                    </p>
                  )}
                </div>

                <div className="create-load-page__field">
                  <label htmlFor="load-destination">Destination</label>

                  <select
                    id="load-destination"
                    value={formData.destinationCity}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        destinationCity: event.target.value,
                      }));

                      clearError("destinationCity");
                    }}
                    aria-invalid={Boolean(errors.destinationCity)}
                    aria-describedby={
                      errors.destinationCity
                        ? "load-destination-error"
                        : undefined
                    }
                    required
                  >
                    <option value="">Select destination</option>

                    {locations.map((location) => (
                      <option
                        key={`${location.city}-${location.province}`}
                        value={location.city}
                      >
                        {location.city} — {location.province}
                      </option>
                    ))}
                  </select>

                  {errors.destinationCity && (
                    <p
                      id="load-destination-error"
                      className="create-load-page__error"
                    >
                      {errors.destinationCity}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="create-load-page__section">
              <legend>Cargo details</legend>

              <p className="create-load-page__section-description">
                Describe the cargo and the transport capacity it requires.
              </p>

              <div className="create-load-page__grid">
                <div className="create-load-page__field">
                  <label htmlFor="load-cargo-type">Cargo type</label>

                  <select
                    id="load-cargo-type"
                    value={formData.cargoType}
                    onChange={(event) =>
                      handleCargoTypeChange(
                        event.target.value as CargoType | "",
                      )
                    }
                    aria-invalid={Boolean(errors.cargoType)}
                    aria-describedby={
                      errors.cargoType ? "load-cargo-type-error" : undefined
                    }
                    required
                  >
                    <option value="">Select cargo type</option>

                    {cargoTypes.map((cargoType) => (
                      <option key={cargoType} value={cargoType}>
                        {cargoType}
                      </option>
                    ))}
                  </select>

                  {errors.cargoType && (
                    <p
                      id="load-cargo-type-error"
                      className="create-load-page__error"
                    >
                      {errors.cargoType}
                    </p>
                  )}
                </div>

                <div className="create-load-page__field">
                  <label htmlFor="load-vehicle-type">
                    Required vehicle type
                  </label>

                  <select
                    id="load-vehicle-type"
                    value={formData.requiredVehicleType}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        requiredVehicleType: event.target.value as
                          | VehicleTypeId
                          | "",
                      }));

                      clearError("requiredVehicleType");
                    }}
                    disabled={!formData.cargoType}
                    aria-invalid={Boolean(errors.requiredVehicleType)}
                    aria-describedby={
                      errors.requiredVehicleType
                        ? "load-vehicle-type-error"
                        : "load-vehicle-type-help"
                    }
                    required
                  >
                    <option value="">
                      {formData.cargoType
                        ? "Select vehicle type"
                        : "Select cargo type first"}
                    </option>

                    {compatibleVehicleTypes.map((vehicleType) => (
                      <option key={vehicleType.id} value={vehicleType.id}>
                        {vehicleType.label}
                      </option>
                    ))}
                  </select>

                  <p
                    id="load-vehicle-type-help"
                    className="create-load-page__helper"
                  >
                    Vehicle options are filtered using cargo compatibility.
                  </p>

                  {errors.requiredVehicleType && (
                    <p
                      id="load-vehicle-type-error"
                      className="create-load-page__error"
                    >
                      {errors.requiredVehicleType}
                    </p>
                  )}
                </div>

                <div className="create-load-page__field">
                  <label htmlFor="load-weight">Weight (kg)</label>

                  <input
                    id="load-weight"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.weightKg}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        weightKg: event.target.value,
                      }));

                      clearError("weightKg");
                    }}
                    placeholder="e.g. 18000"
                    aria-invalid={Boolean(errors.weightKg)}
                    aria-describedby={
                      errors.weightKg ? "load-weight-error" : undefined
                    }
                    required
                  />

                  {errors.weightKg && (
                    <p
                      id="load-weight-error"
                      className="create-load-page__error"
                    >
                      {errors.weightKg}
                    </p>
                  )}
                </div>

                <div className="create-load-page__field">
                  <label htmlFor="load-volume">Volume (m³)</label>

                  <input
                    id="load-volume"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.volumeM3}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        volumeM3: event.target.value,
                      }));

                      clearError("volumeM3");
                    }}
                    placeholder="e.g. 52"
                    aria-invalid={Boolean(errors.volumeM3)}
                    aria-describedby={
                      errors.volumeM3 ? "load-volume-error" : undefined
                    }
                    required
                  />

                  {errors.volumeM3 && (
                    <p
                      id="load-volume-error"
                      className="create-load-page__error"
                    >
                      {errors.volumeM3}
                    </p>
                  )}
                </div>

                <div className="create-load-page__field create-load-page__field--full">
                  <label htmlFor="load-description">Cargo description</label>

                  <textarea
                    id="load-description"
                    value={formData.description}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        description: event.target.value,
                      }));

                      clearError("description");
                    }}
                    placeholder="Briefly describe the cargo, packaging or handling requirements."
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={
                      errors.description ? "load-description-error" : undefined
                    }
                    required
                  />

                  {errors.description && (
                    <p
                      id="load-description-error"
                      className="create-load-page__error"
                    >
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="create-load-page__section">
              <legend>Pickup window</legend>

              <p className="create-load-page__section-description">
                Specify when the cargo will be ready for collection.
              </p>

              <div className="create-load-page__grid">
                <div className="create-load-page__field">
                  <label htmlFor="load-pickup-start">Pickup from</label>

                  <input
                    id="load-pickup-start"
                    type="datetime-local"
                    value={formData.pickupStart}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        pickupStart: event.target.value,
                      }));

                      clearError("pickupStart");
                      clearError("pickupEnd");
                    }}
                    aria-invalid={Boolean(errors.pickupStart)}
                    aria-describedby={
                      errors.pickupStart ? "load-pickup-start-error" : undefined
                    }
                    required
                  />

                  {errors.pickupStart && (
                    <p
                      id="load-pickup-start-error"
                      className="create-load-page__error"
                    >
                      {errors.pickupStart}
                    </p>
                  )}
                </div>

                <div className="create-load-page__field">
                  <label htmlFor="load-pickup-end">Pickup until</label>

                  <input
                    id="load-pickup-end"
                    type="datetime-local"
                    value={formData.pickupEnd}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        pickupEnd: event.target.value,
                      }));

                      clearError("pickupEnd");
                    }}
                    aria-invalid={Boolean(errors.pickupEnd)}
                    aria-describedby={
                      errors.pickupEnd ? "load-pickup-end-error" : undefined
                    }
                    required
                  />

                  {errors.pickupEnd && (
                    <p
                      id="load-pickup-end-error"
                      className="create-load-page__error"
                    >
                      {errors.pickupEnd}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            <div className="create-load-page__actions">
              <Link
                className="create-load-page__secondary-action"
                to={ROUTES.freightOwnerLoads}
              >
                Cancel
              </Link>

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating load..." : "Create load"}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
