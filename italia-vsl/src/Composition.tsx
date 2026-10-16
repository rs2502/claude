import { Composition } from "remotion";
import { Vsl, VSL_DURATION } from "./Vsl";

export const MyComposition = () => {
  return (
    <Composition
      id="ItaliaVSL"
      component={Vsl}
      durationInFrames={VSL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
