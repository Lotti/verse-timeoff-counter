import { useEffect, useState } from 'react';

const API = globalThis.browser ?? globalThis.chrome;

const DEFAULT_SETTINGS = {
  vacationDays: '20',
  workReductionHours: '128',
  vacationRegex: 'ferie',
  reductionRegex: 'permesso|rol',
};

function toStoredSettings(settings) {
  return {
    vacationDays: Number(settings.vacationDays),
    workReductionHours: Number(settings.workReductionHours),
    vacationRegex: settings.vacationRegex.trim(),
    reductionRegex: settings.reductionRegex.trim(),
  };
}

function validateRegex(value, fieldLabel) {
  try {
    new RegExp(value, 'i');
    return null;
  } catch (error) {
    return `${fieldLabel}: ${error.message}`;
  }
}

export default function SettingsForm() {
  const [formValues, setFormValues] = useState(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ kind: 'idle', message: '' });

  useEffect(() => {
    let isCancelled = false;

    async function loadSettings() {
      try {
        const stored = await API.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
        if (isCancelled) {
          return;
        }

        setFormValues({
          vacationDays: String(stored.vacationDays ?? DEFAULT_SETTINGS.vacationDays),
          workReductionHours: String(
            stored.workReductionHours ?? DEFAULT_SETTINGS.workReductionHours,
          ),
          vacationRegex: stored.vacationRegex ?? DEFAULT_SETTINGS.vacationRegex,
          reductionRegex: stored.reductionRegex ?? DEFAULT_SETTINGS.reductionRegex,
        });
      } catch (error) {
        if (!isCancelled) {
          setStatus({
            kind: 'error',
            message: `Unable to load stored settings: ${error.message}`,
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    }

    void loadSettings();

    return () => {
      isCancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setIsDirty(true);
    setStatus({ kind: 'idle', message: '' });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const regexError =
      validateRegex(formValues.vacationRegex, 'Vacation label regex') ??
      validateRegex(formValues.reductionRegex, 'Work reduction label regex');

    if (regexError) {
      setStatus({ kind: 'error', message: regexError });
      return;
    }

    setIsSaving(true);
    setStatus({ kind: 'idle', message: '' });

    try {
      const storedSettings = toStoredSettings(formValues);
      await API.storage.sync.set(storedSettings);
      await API.runtime.sendMessage({ type: 'recalculate-all' });
      setIsDirty(false);
      setStatus({ kind: 'success', message: 'Settings saved and Verse tabs refreshed.' });
    } catch (error) {
      setStatus({ kind: 'error', message: `Unable to save settings: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Total vacation days</span>
        <input
          min="0"
          name="vacationDays"
          onChange={handleChange}
          step="0.5"
          type="number"
          value={formValues.vacationDays}
        />
      </label>

      <label className="field">
        <span>Total work reduction hours</span>
        <input
          min="0"
          name="workReductionHours"
          onChange={handleChange}
          step="1"
          type="number"
          value={formValues.workReductionHours}
        />
      </label>

      <label className="field">
        <span>Vacation label regex</span>
        <input
          name="vacationRegex"
          onChange={handleChange}
          spellCheck="false"
          type="text"
          value={formValues.vacationRegex}
        />
      </label>

      <label className="field">
        <span>Work reduction label regex</span>
        <input
          name="reductionRegex"
          onChange={handleChange}
          spellCheck="false"
          type="text"
          value={formValues.reductionRegex}
        />
      </label>

      <div className="actions">
        <button disabled={!isLoaded || !isDirty || isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {status.message ? (
        <p className={`status status-${status.kind}`} role="status">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
