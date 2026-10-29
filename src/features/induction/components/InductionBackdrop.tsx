import starfield from '../../../assets/images/signin_starfield.webp';

/** The starfield image and dark wash behind every induction screen. */
export function InductionBackdrop() {
  return (
    <>
      <img
        src={starfield}
        alt=""
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover opacity-70"
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/40" />
    </>
  );
}
