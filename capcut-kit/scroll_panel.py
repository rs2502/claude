#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "pyobjc-framework-ApplicationServices",
#   "pyobjc-framework-Quartz",
# ]
# ///
import sys
from Quartz import (
    CGEventCreateScrollWheelEvent,
    CGEventPost,
    CGEventSetLocation,
    kCGHIDEventTap,
    kCGScrollEventUnitPixel,
    CGPointMake,
)

x, y, amount = float(sys.argv[1]), float(sys.argv[2]), int(sys.argv[3])
ev = CGEventCreateScrollWheelEvent(None, kCGScrollEventUnitPixel, 1, amount)
CGEventSetLocation(ev, CGPointMake(x, y))
CGEventPost(kCGHIDEventTap, ev)
print(f"scrolled {amount}px at ({x},{y})")
