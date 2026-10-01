from parser import parse_message

RECEIVED = "2026-09-29T10:00:00+05:30"


def test_valid_signal_parses_with_high_confidence():
    text = "BUY NIFTY SEP 24000 CE ABOVE 150\nSL 120\nTARGET 180"
    signal = parse_message(text, "Mani Telegram", RECEIVED, "Angel One")
    assert signal is not None
    assert signal["underlying"] == "NIFTY"
    assert signal["strike"] == 24000
    assert signal["stopLoss"] == 120
    assert signal["targetMin"] == 180
    assert signal["status"] == "WAITING_FOR_ENTRY"
    assert signal["confidence"] == 0.99


def test_missing_stoploss_alone_still_waits_for_entry():
    text = "BUY NIFTY SEP 24000 CE ABOVE 150\nTARGET 180"
    signal = parse_message(text, "Mani Telegram", RECEIVED, "Angel One")
    assert signal is not None
    assert signal["status"] == "WAITING_FOR_ENTRY"
    assert signal["confidence"] == 0.9


def test_missing_both_sl_and_target_drops_confidence_further():
    text = "BUY NIFTY SEP 24000 CE ABOVE 150"
    signal = parse_message(text, "Mani Telegram", RECEIVED, "Angel One")
    assert signal is not None
    assert signal["confidence"] == 0.5
    assert signal["status"] == "MANUAL_REVIEW"


def test_out_of_range_entry_price_forces_zero_confidence():
    text = "BUY NIFTY SEP 24000 CE ABOVE 999999\nSL 120\nTARGET 180"
    signal = parse_message(text, "Mani Telegram", RECEIVED, "Angel One")
    assert signal is not None
    assert signal["confidence"] == 0.0
    assert signal["status"] == "MANUAL_REVIEW"
    assert "out of range" in signal["rejectionReason"]


def test_unknown_underlying_forces_zero_confidence():
    text = "BUY RANDOMSTOCK SEP 100 CE ABOVE 10\nSL 8\nTARGET 15"
    signal = parse_message(text, "Mani Telegram", RECEIVED, "Angel One")
    assert signal is not None
    assert signal["confidence"] == 0.0
    assert "unknown underlying" in signal["rejectionReason"]


def test_non_matching_text_returns_none():
    assert parse_message("hello there", "Mani Telegram", RECEIVED, "Angel One") is None
