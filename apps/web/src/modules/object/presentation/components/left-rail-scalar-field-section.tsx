'use client';

export type LeftRailScalarFieldSectionProps = {
  headingLabel: string;
  text: string;
  editToolbar?: React.ReactNode;
};

export function LeftRailScalarFieldSection({
  headingLabel,
  text,
  editToolbar,
}: LeftRailScalarFieldSectionProps) {
  const trimmed = text.trim();
  if (!trimmed && editToolbar == null) {
    return null;
  }

  return (
    <div className="space-y-1">
      {editToolbar}
      {trimmed ? (
        <>
          <p className="text-body-sm font-weight-body text-fg">{headingLabel}:</p>
          <p className="leading-editorial text-fg">{trimmed}</p>
        </>
      ) : null}
    </div>
  );
}
