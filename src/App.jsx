import SettingsForm from './components/SettingsForm.jsx';

export default function App() {
  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Firefox Extension</p>
        <h1>Verse TimeOff Counter</h1>
        <p className="lede">
          Track remaining vacation days and work reduction hours directly inside Verse
          Calendar.
        </p>
        <SettingsForm />
      </section>
    </main>
  );
}
