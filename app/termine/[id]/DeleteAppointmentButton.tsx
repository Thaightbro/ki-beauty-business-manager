"use client";

export default function DeleteAppointmentButton({
  action,
}: {
  action: () => void;
}) {
  return (
    <form
      action={action}
      style={{ display: "inline-block" }}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Möchtest du diesen Termin wirklich löschen?"
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        style={{
          marginLeft: 12,
          padding: "12px 18px",
          background: "#fff",
          color: "#b91c1c",
          border: "1px solid #b91c1c",
          borderRadius: 10,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Termin löschen
      </button>
    </form>
  );
}
