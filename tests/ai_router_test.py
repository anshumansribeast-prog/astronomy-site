from ai_router import should_fallback

assert should_fallback("[OUT_OF_KNOWLEDGE] need verification")
assert should_fallback("I cannot verify that reliably.")
assert not should_fallback("Jupiter is the largest planet in the Solar System.")
assert not should_fallback("A star spectrum can reveal its composition.")
print("Beast model router checks passed")
