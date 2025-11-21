import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import UserMenu from '../UserMenu/UserMenu';
import SettingsMenu from '../SettingsMenu/SettingsMenu';

import {
    IoArrowBack,
    IoArrowForward,
    IoSearch,
    IoSettings,
} from 'react-icons/io5';

function Header({ onShowAuthModal, onPlaySong, user, isLoggedIn, onLogout, onChangePassword, onViewProfile, onUpgradeVip, onViewInvoices }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchRef = useRef(null);

    // Search Effect
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            fetch(`http://localhost:5001/api/search?q=${searchTerm}`)
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                })
                .catch(err => console.error('Lỗi tìm kiếm:', err));
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleResultClick = (song) => {
        onPlaySong(song, [song]);
        setSearchTerm('');
        setSearchResults([]);
        setIsSearchActive(false);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchActive(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);

    return (
        <header className="zm-header">
            <div className="level">
                <div className="level-left">
                    <button className="zm-btn disabled button" tabIndex={0} disabled>
                        <IoArrowBack />
                    </button>
                    <button className="zm-btn disabled button" tabIndex={0} disabled>
                        <IoArrowForward />
                    </button>
                    
                    <div className="search-wrapper" ref={searchRef}>
                        <form className="search" onSubmit={handleSearchSubmit}>
                            <div className="search__container">
                                <button className="zm-btn button" tabIndex={0} type="submit">
                                    <IoSearch />
                                </button>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        className="form-control z-input-placeholder"
                                        placeholder="Tìm kiếm bài hát, nghệ sĩ..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onFocus={() => setIsSearchActive(true)}
                                    />
                                </div>
                            </div>
                        </form>

                        {isSearchActive && searchTerm.length > 0 && (
                            <div className="search-results-popover">
                                {searchResults.length > 0 ? (
                                    searchResults.map(song => (
                                        <div 
                                            className="search-result-item" 
                                            key={song.id}
                                            onMouseDown={() => handleResultClick(song)}
                                        >
                                            <img 
                                                src={song.imageUrl} 
                                                alt={song.title} 
                                                className="search-result-image"
                                            />
                                            <div className="search-result-info">
                                                <h4>{song.title}</h4>
                                                <p>{song.artists}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="search-no-results">
                                        Không tìm thấy kết quả.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="level-right">
                    <button 
                        className="header-upgrade-vip-button" 
                        onClick={onUpgradeVip}
                        style={{border: 'none', cursor: 'pointer'}}
                    >
                        Nâng cấp tài khoản
                    </button>
                    
                    <div className="setting-item">
                        <SettingsMenu />
                    </div>
                    
                    <div className="user-setting">
                        <UserMenu 
                            user={user}
                            isLoggedIn={isLoggedIn}
                            onLogin={onShowAuthModal}
                            onLogout={onLogout}
                            onChangePassword={onChangePassword} // Hàm này sẽ được truyền từ App.js
                            onViewProfile={onViewProfile}
                            onViewInvoices={onViewInvoices}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;